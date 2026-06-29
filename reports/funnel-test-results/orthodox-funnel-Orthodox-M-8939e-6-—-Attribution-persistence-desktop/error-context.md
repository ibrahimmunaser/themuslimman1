# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: orthodox-funnel.spec.ts >> Orthodox Muslim conversion funnel audit >> 6 — Attribution persistence
- Location: tests\funnel\orthodox-funnel.spec.ts:106:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "orthodox_300_video"
Received: "seerah_launch"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "TheMuslimMan" [ref=e4] [cursor=pointer]:
        - /url: /
        - img "TheMuslimMan" [ref=e5]
      - generic [ref=e6]:
        - img [ref=e7]
        - text: Secure checkout
  - generic [ref=e12]:
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]:
          - paragraph [ref=e17]: Individual Access
          - paragraph [ref=e18]: Continue the full 100-part Seerah path.
          - paragraph [ref=e19]: Videos · quizzes · flashcards · summaries · progress tracking
        - generic [ref=e20]:
          - paragraph [ref=e21]: $4.99
          - paragraph [ref=e22]: /month
      - generic [ref=e23]:
        - generic [ref=e24]:
          - img [ref=e25]
          - text: Cancel anytime
        - generic [ref=e27]:
          - img [ref=e28]
          - text: Instant access
        - generic [ref=e30]:
          - img [ref=e31]
          - text: 7-day refund
      - button "Change plan →" [ref=e33]
    - generic [ref=e34]:
      - textbox "Full name" [ref=e35]
      - generic [ref=e36]:
        - textbox "Email address" [ref=e37]
        - button [ref=e38]: Continue
        - paragraph [ref=e39]:
          - text: Already have an account?
          - button "Sign in" [ref=e40]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e46] [cursor=pointer]:
    - img [ref=e47]
  - alert [ref=e50]
```

# Test source

```ts
  20  |     await expect(page.getByRole("heading", { name: /You came from The Orthodox Muslim/i })).toBeVisible();
  21  |     await expect(page.getByText(/100 structured lessons/i)).toBeVisible();
  22  | 
  23  |     const ctas = await getVisibleCta(page);
  24  |     expect(ctas.some((t) => STRONG_CTA.test(t)), `Above-fold CTAs: ${ctas.join(" | ")}`).toBeTruthy();
  25  | 
  26  |     monitor.assertClean();
  27  |     await shot(page, `01-landing-${testInfo.project.name}`);
  28  |   });
  29  | 
  30  |   test("2 — Mobile above-the-fold CTA", async ({ page }, testInfo) => {
  31  |     test.skip(testInfo.project.name === "desktop", "Mobile-only test");
  32  |     const monitor = attachMonitors(page);
  33  |     await page.goto("/theorthodoxmuslim");
  34  | 
  35  |     const ctas = await getVisibleCta(page);
  36  |     const strong = ctas.filter((t) => STRONG_CTA.test(t));
  37  |     expect(strong.length, `Weak or missing CTAs: ${ctas.join(" | ")}`).toBeGreaterThan(0);
  38  |     expect(strong.some((t) => WEAK_CTA.test(t))).toBeFalsy();
  39  | 
  40  |     const clickable = page.getByRole("link", { name: STRONG_CTA }).or(
  41  |       page.getByRole("button", { name: STRONG_CTA }),
  42  |     );
  43  |     await expect(clickable.first()).toBeVisible();
  44  |     await expect(clickable.first()).toBeEnabled();
  45  | 
  46  |     await shot(page, `02-mobile-above-fold-${testInfo.project.name}`);
  47  |     monitor.assertClean();
  48  |   });
  49  | 
  50  |   test("3 — Free lesson path (inline Part 1, not /seerah/part-1)", async ({ page }, testInfo) => {
  51  |     const monitor = attachMonitors(page);
  52  |     await page.goto("/theorthodoxmuslim");
  53  |     await clickFirstMatching(page, /watch part 1 free first|watch part 1/i);
  54  | 
  55  |     await expect(page.locator("#part1")).toBeInViewport();
  56  |     await expect(page.getByRole("heading", { name: /Try the Full Lesson/i })).toBeVisible();
  57  | 
  58  |     const videoTab = page.getByRole("button", { name: /^Video$/i });
  59  |     if (await videoTab.isVisible()) await videoTab.click();
  60  | 
  61  |     await expect(page.locator("#part1")).toContainText(/Part 1/i);
  62  | 
  63  |     await shot(page, `03-part1-inline-${testInfo.project.name}`);
  64  |     monitor.assertClean();
  65  |   });
  66  | 
  67  |   test("4 — Checkout path and pricing", async ({ page }, testInfo) => {
  68  |     const monitor = attachMonitors(page);
  69  |     await page.goto("/theorthodoxmuslim");
  70  | 
  71  |     const monthlyLink = page.getByRole("link", { name: /Start monthly|individual monthly|\$4\.99/i }).first();
  72  |     await expect(monthlyLink).toBeVisible();
  73  |     await monthlyLink.click();
  74  | 
  75  |     await page.waitForURL(/\/checkout/);
  76  |     await expect(page.getByText(/\$4\.99|4\.99/i).first()).toBeVisible();
  77  |     await expect(page.getByText(/100|lesson|Seerah|Muslim Man/i).first()).toBeVisible();
  78  | 
  79  |     const url = new URL(page.url());
  80  |     expect(url.searchParams.get("source")).toBe("theorthodoxmuslim");
  81  | 
  82  |     await shot(page, `04-checkout-${testInfo.project.name}`);
  83  |     monitor.assertClean();
  84  |   });
  85  | 
  86  |   test("5 — Auth friction (logged-out guest checkout)", async ({ page }, testInfo) => {
  87  |     await page.context().clearCookies();
  88  |     await page.goto("/checkout?plan=individual-monthly&source=theorthodoxmuslim");
  89  | 
  90  |     const emailField = page.getByPlaceholder(/email/i);
  91  |     await expect(emailField).toBeVisible({ timeout: 15_000 });
  92  | 
  93  |     const loginWall = page.getByText(/sign in to continue/i);
  94  |     const requiresLogin = await loginWall.isVisible().catch(() => false);
  95  |     if (requiresLogin) {
  96  |       expect(page.url()).toContain("checkout");
  97  |       await shot(page, `05-auth-login-required-${testInfo.project.name}`);
  98  |       return;
  99  |     }
  100 | 
  101 |     await emailField.fill("funnel-audit-test@example.com");
  102 |     await expect(page.getByPlaceholder(/email/i)).toHaveValue("funnel-audit-test@example.com");
  103 |     await shot(page, `05-guest-checkout-${testInfo.project.name}`);
  104 |   });
  105 | 
  106 |   test("6 — Attribution persistence", async ({ page }) => {
  107 |     await page.goto(ORTHODOX_UTM);
  108 |     await page.waitForFunction(() => sessionStorage.getItem("tmm_first_touch") !== null, null, {
  109 |       timeout: 10_000,
  110 |     });
  111 |     const storage = await readStorageAttribution(page);
  112 |     expect(storage.first_touch).toBeTruthy();
  113 | 
  114 |     await clickFirstMatching(page, /start monthly|\$4\.99/i);
  115 |     await page.waitForURL(/\/checkout/);
  116 | 
  117 |     const checkoutUrl = new URL(page.url());
  118 |     expect(checkoutUrl.searchParams.get("source")).toBe("theorthodoxmuslim");
  119 |     expect(checkoutUrl.searchParams.get("utm_source")).toBe("youtube");
> 120 |     expect(checkoutUrl.searchParams.get("utm_campaign")).toBe("orthodox_300_video");
      |                                                          ^ Error: expect(received).toBe(expected) // Object.is equality
  121 |   });
  122 | 
  123 |   test("7 — Checkout session creation for active plans", async ({ page }) => {
  124 |     const plans = ["individual-monthly", "individual-lifetime", "family-monthly", "family-lifetime"] as const;
  125 | 
  126 |     for (const plan of plans) {
  127 |       await page.context().clearCookies();
  128 |       const calls: { url: string; status: number }[] = [];
  129 |       const handler = async (route: import("@playwright/test").Route) => {
  130 |         const res = await route.fetch();
  131 |         calls.push({ url: route.request().url(), status: res.status() });
  132 |         await route.fulfill({ response: res });
  133 |       };
  134 |       await page.route("**/api/stripe/create-*", handler);
  135 | 
  136 |       await page.goto(`/checkout?plan=${plan}&source=theorthodoxmuslim&utm_source=youtube`);
  137 |       const email = page.getByPlaceholder(/email/i);
  138 |       if (await email.isVisible({ timeout: 10_000 }).catch(() => false)) {
  139 |         await email.fill(`audit-${plan}@example.com`);
  140 |         await email.blur();
  141 |         await page.waitForTimeout(2000);
  142 |       }
  143 | 
  144 |       const apiCall = calls.find((c) => c.url.includes("/api/stripe/"));
  145 |       if (apiCall) expect(apiCall.status).toBeLessThan(500);
  146 |       await page.unroute("**/api/stripe/create-*", handler);
  147 |     }
  148 |   });
  149 | 
  150 |   test("8 — Checkout failure handling", async ({ page }) => {
  151 |     await page.context().clearCookies();
  152 |     await page.route("**/api/stripe/create-subscription-intent", async (route) => {
  153 |       await route.fulfill({
  154 |         status: 500,
  155 |         contentType: "application/json",
  156 |         body: JSON.stringify({ error: "Simulated failure for audit test" }),
  157 |       });
  158 |     });
  159 | 
  160 |     await page.goto("/checkout?plan=individual-monthly&source=theorthodoxmuslim");
  161 |     await page.getByPlaceholder(/email/i).fill("funnel-fail@example.com");
  162 |     await page.getByPlaceholder(/email/i).blur();
  163 |     await page.waitForTimeout(3500);
  164 | 
  165 |     const errorVisible =
  166 |       (await page.getByText(/failed|error|try again|initialize checkout/i).first().isVisible().catch(() => false)) ||
  167 |       (await page.locator(".text-red-400, [class*='red']").first().isVisible().catch(() => false));
  168 |     expect(errorVisible).toBeTruthy();
  169 |     await expect(page.getByPlaceholder(/email/i)).toBeEnabled();
  170 |     await page.unrouteAll({ behavior: "ignoreErrors" });
  171 |   });
  172 | });
  173 | 
```