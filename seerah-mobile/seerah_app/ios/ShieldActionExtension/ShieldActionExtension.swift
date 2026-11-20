import ManagedSettings

/// Handles taps on the shield's two buttons (labels defined in
/// ShieldConfigurationExtension). Apple requires every path to call
/// `completionHandler` with `.close` or `.defer` — there is no "let the
/// guarded app open" response, by design.
class ShieldActionExtension: ShieldActionDelegate {
    private let store = ManagedSettingsStore()

    override func handle(
        action: ShieldAction,
        for application: ApplicationToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        switch action {
        case .primaryButtonPressed:
            // "Go pray": just dismiss back to the home screen, same as
            // Android's Answer button. The shield stays in place for the
            // rest of the window.
            completionHandler(.close)
        case .secondaryButtonPressed:
            // "Not now": mirrors Android's Decline — lift the shield for
            // just this one app for the remainder of the current window,
            // rather than the whole guard window or every guarded app.
            var remaining = store.shield.applications ?? []
            remaining.remove(application)
            store.shield.applications = remaining.isEmpty ? nil : remaining
            completionHandler(.close)
        @unknown default:
            completionHandler(.close)
        }
    }

    override func handle(
        action: ShieldAction,
        for webDomain: WebDomainToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        // App Guard only ever shields apps/categories, never web domains —
        // this override exists because the protocol requires it.
        completionHandler(.close)
    }

    override func handle(
        action: ShieldAction,
        for category: ActivityCategoryToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        switch action {
        case .primaryButtonPressed:
            completionHandler(.close)
        case .secondaryButtonPressed:
            var remaining = store.shield.applicationCategories
            if case .specific(var tokens) = remaining {
                tokens.remove(category)
                remaining = tokens.isEmpty ? .none : .specific(tokens)
            }
            store.shield.applicationCategories = remaining
            completionHandler(.close)
        @unknown default:
            completionHandler(.close)
        }
    }
}
