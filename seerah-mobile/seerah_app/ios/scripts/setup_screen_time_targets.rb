#!/usr/bin/env ruby
# frozen_string_literal: true

# Adds the three Screen Time app extension targets App Guard needs on iOS
# (DeviceActivityMonitorExtension, ShieldConfigurationExtension,
# ShieldActionExtension) to Runner.xcodeproj, and embeds them in the main
# Runner app.
#
# Why this is a script and not committed Xcode project state: these targets
# can only sign/build once Apple has approved the Family Controls
# (Distribution) entitlement for all four bundle IDs (Runner + the three
# extensions below) — see ../../IOS_SCREEN_TIME_SETUP.md. Adding them to the
# checked-in project.pbxproj unconditionally would break EVERY ordinary
# build (including this app's current CI) the same way the Time Sensitive
# Notifications entitlement did, the moment Xcode tries to resolve a
# provisioning profile for an extension nobody has approved yet.
#
# Instead this script is idempotent (safe to run repeatedly) and opt-in: it
# only runs when ENABLE_SCREEN_TIME_EXTENSIONS=1 is set, from
# codemagic.yaml's ios-release workflow, right before `pod install`. Flip
# that flag to 1 (and uncomment the Family Controls / App Group entitlement
# keys in Runner/Runner.entitlements) only once:
#   1. Apple has approved Family Controls (Distribution) for all 4 bundle
#      IDs (see IOS_SCREEN_TIME_SETUP.md for how to request it),
#   2. the group.com.themuslimman.seerah App Group is registered and
#      enabled for all 4 bundle IDs on the Developer Portal, and
#   3. the "themuslimman_appstore" provisioning profile has been
#      regenerated (and re-fetched in Codemagic) to include all of the
#      above.
#
# Local/manual use: run `ruby ios/scripts/setup_screen_time_targets.rb` from
# seerah_app/ on a Mac with the `xcodeproj` gem installed
# (`gem install xcodeproj`, or it's already present via CocoaPods) to add
# the targets to your local checkout for testing against the development
# entitlement (which needs no Apple approval — see IOS_SCREEN_TIME_SETUP.md).

require 'xcodeproj'

ROOT = File.expand_path('../..', __dir__)
PROJECT_PATH = File.join(ROOT, 'Runner.xcodeproj')
BUNDLE_PREFIX = 'com.themuslimman.seerah'
APP_GROUP = 'group.com.themuslimman.seerah'
DEPLOYMENT_TARGET = '16.0' # FamilyControls/DeviceActivity/ManagedSettings require iOS 16+

EXTENSIONS = [
  {
    name: 'DeviceActivityMonitorExtension',
    frameworks: %w[DeviceActivity ManagedSettings],
  },
  {
    name: 'ShieldConfigurationExtension',
    frameworks: %w[ManagedSettings ManagedSettingsUI UIKit],
  },
  {
    name: 'ShieldActionExtension',
    frameworks: %w[ManagedSettings],
  },
].freeze

project = Xcodeproj::Project.open(PROJECT_PATH)
main_target = project.targets.find { |t| t.name == 'Runner' }
raise "Could not find the 'Runner' target in #{PROJECT_PATH}" unless main_target

# Flips on the SCREEN_TIME_GUARD_ENABLED Swift compilation condition that
# AppGuardManager.swift / GuardShared.swift gate their FamilyControls /
# DeviceActivity / ManagedSettings imports behind. Without this, those
# frameworks would compile into Runner's binary unconditionally (since
# `canImport(FamilyControls)` alone is true on any iOS 16+ SDK regardless of
# entitlement approval) — exactly the "includes ScreenTime APIs, but it does
# not include any features that require it" Guideline 2.5.1 rejection this
# script's gating exists to prevent on ordinary (entitlement-less) builds.
def enable_screen_time_guard_flag(target)
  target.build_configurations.each do |bc|
    existing = bc.build_settings['SWIFT_ACTIVE_COMPILATION_CONDITIONS']
    flags = [existing, '$(inherited)', 'SCREEN_TIME_GUARD_ENABLED'].compact.join(' ')
    bc.build_settings['SWIFT_ACTIVE_COMPILATION_CONDITIONS'] = flags
  end
end

enable_screen_time_guard_flag(main_target)

debug_xcconfig = project.files.find { |f| f.path == 'Flutter/Debug.xcconfig' }
release_xcconfig = project.files.find { |f| f.path == 'Flutter/Release.xcconfig' }
raise 'Could not find Flutter/Debug.xcconfig or Flutter/Release.xcconfig' unless debug_xcconfig && release_xcconfig

runner_group = project.main_group['Runner']
shared_file_ref = runner_group && runner_group.children.find do |f|
  f.respond_to?(:path) && f.path == 'GuardShared.swift'
end
raise 'Could not find Runner/GuardShared.swift in the project' unless shared_file_ref

def add_system_framework(project, target, framework_name)
  frameworks_group = project.frameworks_group
  existing = frameworks_group.files.find { |f| f.path == "System/Library/Frameworks/#{framework_name}.framework" }
  file_ref = existing || frameworks_group.new_file(
    "System/Library/Frameworks/#{framework_name}.framework",
    :sdk_root
  )
  already_linked = target.frameworks_build_phase.files.any? { |bf| bf.file_ref == file_ref }
  target.frameworks_build_phase.add_file_reference(file_ref) unless already_linked
end

embed_phase = main_target.copy_files_build_phases.find { |p| p.name == 'Embed Foundation Extensions' } ||
              main_target.new_copy_files_build_phase('Embed Foundation Extensions')
embed_phase.symbol_dst_subfolder_spec = :plug_ins

EXTENSIONS.each do |config|
  name = config[:name]
  bundle_id = "#{BUNDLE_PREFIX}.#{name}"

  existing_target = project.targets.find { |t| t.name == name }
  if existing_target
    puts "#{name}: target already exists, skipping creation."
    next
  end

  puts "#{name}: creating app extension target (#{bundle_id})…"

  ext_target = project.new_target(:app_extension, name, :ios, DEPLOYMENT_TARGET)

  # ── Group + source files ────────────────────────────────────────────────
  group = project.main_group.new_group(name, name)
  swift_ref = group.new_file("#{name}.swift")
  info_plist_ref = group.new_file('Info.plist')
  entitlements_ref = group.new_file("#{name}.entitlements")
  privacy_ref = group.new_file('PrivacyInfo.xcprivacy')

  ext_target.add_file_references([swift_ref])
  ext_target.add_file_references([shared_file_ref]) # shared across all 3 extensions + main app
  ext_target.add_resources([privacy_ref])

  # ── Frameworks ───────────────────────────────────────────────────────────
  config[:frameworks].each { |fw| add_system_framework(project, ext_target, fw) }

  # ── Build settings (mirrors Runner's own Debug/Release/Profile configs) ──
  ext_target.build_configurations.each do |bc|
    bc.base_configuration_reference =
      bc.name == 'Debug' ? debug_xcconfig : release_xcconfig

    bc.build_settings.merge!(
      'PRODUCT_BUNDLE_IDENTIFIER' => bundle_id,
      'PRODUCT_NAME' => '$(TARGET_NAME)',
      'INFOPLIST_FILE' => "#{name}/Info.plist",
      'CODE_SIGN_ENTITLEMENTS' => "#{name}/#{name}.entitlements",
      'CURRENT_PROJECT_VERSION' => '$(FLUTTER_BUILD_NUMBER)',
      'GENERATE_INFOPLIST_FILE' => 'NO',
      'SWIFT_VERSION' => '5.0',
      'TARGETED_DEVICE_FAMILY' => '1',
      'IPHONEOS_DEPLOYMENT_TARGET' => DEPLOYMENT_TARGET,
      'SKIP_INSTALL' => 'YES',
      'LD_RUNPATH_SEARCH_PATHS' => [
        '$(inherited)',
        '@executable_path/Frameworks',
        '@executable_path/../../Frameworks',
      ],
      'CODE_SIGN_STYLE' => 'Manual', # matches xcode-project use-profiles' manual signing for Runner
    )
  end
  enable_screen_time_guard_flag(ext_target)

  # ── Embed in the main app ────────────────────────────────────────────────
  main_target.add_dependency(ext_target)
  embed_build_file = embed_phase.add_file_reference(ext_target.product_reference)
  embed_build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

  puts "#{name}: done."
end

project.save
puts "\nSaved #{PROJECT_PATH} with #{EXTENSIONS.length} Screen Time extension target(s)."
puts 'Next: in Codemagic, fetch/regenerate provisioning profiles covering all 4 bundle IDs ' \
     '(see IOS_SCREEN_TIME_SETUP.md), then uncomment the entitlement keys in ' \
     'Runner/Runner.entitlements and flip ScreenTimeGuardEnabled to true in Runner/Info.plist.'
