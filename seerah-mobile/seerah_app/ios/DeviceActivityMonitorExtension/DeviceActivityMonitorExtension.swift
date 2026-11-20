import DeviceActivity
import ManagedSettings

/// Screen Time app extension: runs in its own process and is woken by the
/// system at the start/end of each `DeviceActivitySchedule` armed from
/// `AppGuardManager.scheduleGuardWindows` (one schedule per prayer, see
/// GuardShared.swift for why this file is shared with the main app).
///
/// This is the only place that actually turns the shield on/off — the main
/// app only arms schedules, it never runs while the window is open.
class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    private let store = ManagedSettingsStore()

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)

        // The Decline button in ShieldActionExtension can turn guarding off
        // for the rest of a window, but it never writes `enabled = false`;
        // this is the one global kill switch (Settings toggle writes it).
        guard GuardShared.enabled else { return }

        // Read by ShieldConfigurationExtension for "It's time for <prayer>."
        GuardShared.currentPrayerName = activity.rawValue

        let selection = GuardShared.loadSelection()
        store.shield.applications = selection.applicationTokens.isEmpty
            ? nil
            : selection.applicationTokens
        store.shield.applicationCategories = selection.categoryTokens.isEmpty
            ? nil
            : .specific(selection.categoryTokens)
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        // Always lift the shield at window end, even if guarding was
        // disabled mid-window — nothing should still be covered once the
        // 15-minute window is over.
        store.shield.applications = nil
        store.shield.applicationCategories = nil
    }

    // Intentionally no event-threshold handling: guard windows are pure
    // time intervals (prayer time → +15 min), not usage-based, so
    // `eventDidReachThreshold` has nothing to do here.
}
