import ManagedSettings
import ManagedSettingsUI
import UIKit

/// Builds the shield UI iOS shows in place of a guarded app's screen.
/// Apple renders and owns this UI (unlike Android's hand-built
/// `GuardBlockActivity`) — this extension only supplies the copy, colors
/// and button labels; the lock screen, ring vibrates, and 5-ring
/// answer/decline gate from the Android build have no iOS equivalent here.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(
        shielding application: Application,
        in category: ActivityCategory
    ) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(
        shielding webDomain: WebDomain,
        in category: ActivityCategory
    ) -> ShieldConfiguration {
        makeConfiguration()
    }

    /// Same message regardless of which guarded app/category/domain
    /// triggered it — Apple's opaque tokens mean this extension never
    /// learns which one anyway (see GuardShared.swift).
    private func makeConfiguration() -> ShieldConfiguration {
        let prayer = GuardShared.currentPrayerName
        return ShieldConfiguration(
            backgroundBlurStyle: .systemMaterialDark,
            backgroundColor: UIColor(red: 0.04, green: 0.08, blue: 0.16, alpha: 1),
            icon: UIImage(systemName: "moon.stars.fill"),
            title: ShieldConfiguration.Label(
                text: "Allah is calling",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "It's time for \(prayer). This app is paused for a few minutes.",
                color: UIColor(white: 1, alpha: 0.85)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Go pray",
                color: .black
            ),
            primaryButtonBackgroundColor: .white,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Not now",
                color: .white
            )
        )
    }
}
