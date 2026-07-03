import { getCheckoutAnalyticsData, pct } from "../lib/queries/checkout-analytics";

async function main() {
  const data = await getCheckoutAnalyticsData();
  const { funnel, sequentialFunnel, breakdownByPlan, breakdownBySource, breakdownByDevice, abandonment } = data;

  const sum = (rows: { loaded: number; started: number; purchased: number; abandoned?: number }[]) =>
    rows.reduce(
      (acc, r) => ({
        loaded: acc.loaded + r.loaded,
        started: acc.started + r.started,
        purchased: acc.purchased + r.purchased,
        abandoned: acc.abandoned + (r.abandoned ?? 0),
      }),
      { loaded: 0, started: 0, purchased: 0, abandoned: 0 }
    );

  const planTotals = sum(breakdownByPlan);
  const sourceTotals = sum(breakdownBySource);
  const deviceTotals = sum(breakdownByDevice.map((r) => ({ ...r, abandoned: 0 })));
  const stageSum = Object.values(abandonment.byStage).reduce((a, b) => a + b, 0);

  console.log("=== Checkout Analytics Verification ===\n");
  console.log("Reporting start:", data.reportingStart.toISOString());
  console.log("Included events:", data.includedEvents);
  console.log("Excluded legacy:", data.excludedLegacyEvents);
  console.log("Total attempts:", data.attempts.length);

  console.log("\n--- Funnel (unique attempts) ---");
  console.log(JSON.stringify(funnel, null, 2));

  console.log("\n--- Sequential funnel ---");
  console.log(
    "plan→loaded:",
    sequentialFunnel.planToLoaded.num,
    "/",
    sequentialFunnel.planToLoaded.den,
    "=",
    pct(sequentialFunnel.planToLoaded.num, sequentialFunnel.planToLoaded.den)
  );
  console.log(
    "loaded→element:",
    sequentialFunnel.loadedToElement.num,
    "/",
    sequentialFunnel.loadedToElement.den,
    "=",
    pct(sequentialFunnel.loadedToElement.num, sequentialFunnel.loadedToElement.den)
  );
  console.log(
    "element→started:",
    sequentialFunnel.elementToStarted.num,
    "/",
    sequentialFunnel.elementToStarted.den,
    "=",
    pct(sequentialFunnel.elementToStarted.num, sequentialFunnel.elementToStarted.den)
  );
  console.log(
    "started→purchase:",
    sequentialFunnel.startedToPurchase.num,
    "/",
    sequentialFunnel.startedToPurchase.den,
    "=",
    pct(sequentialFunnel.startedToPurchase.num, sequentialFunnel.startedToPurchase.den)
  );
  console.log(
    "loaded→purchase:",
    sequentialFunnel.loadedToPurchase.num,
    "/",
    sequentialFunnel.loadedToPurchase.den,
    "=",
    pct(sequentialFunnel.loadedToPurchase.num, sequentialFunnel.loadedToPurchase.den)
  );

  console.log("\n--- Reconciliation ---");
  console.log("Plan breakdown loaded sum:", planTotals.loaded, "vs funnel loaded:", funnel.checkoutLoaded, planTotals.loaded === funnel.checkoutLoaded ? "OK" : "MISMATCH");
  console.log("Plan breakdown started sum:", planTotals.started, "vs funnel started:", funnel.paymentStarted, planTotals.started === funnel.paymentStarted ? "OK" : "MISMATCH");
  console.log("Plan breakdown purchased sum:", planTotals.purchased, "vs funnel purchased:", funnel.purchaseCompleted, planTotals.purchased === funnel.purchaseCompleted ? "OK" : "MISMATCH");
  console.log("Source breakdown loaded sum:", sourceTotals.loaded, "vs funnel loaded:", funnel.checkoutLoaded, sourceTotals.loaded === funnel.checkoutLoaded ? "OK" : "MISMATCH");
  console.log("Device breakdown loaded sum:", deviceTotals.loaded, "vs funnel loaded:", funnel.checkoutLoaded, deviceTotals.loaded === funnel.checkoutLoaded ? "OK" : "MISMATCH");
  console.log("Abandonment stage sum:", stageSum, "vs funnel abandoned:", funnel.abandoned, stageSum === funnel.abandoned ? "OK" : "MISMATCH");

  console.log("\n--- Breakdown by plan ---");
  for (const r of breakdownByPlan) {
    console.log(`${r.plan}: loaded=${r.loaded} started=${r.started} purchased=${r.purchased} abandoned=${r.abandoned} cvr=${pct(r.purchased, r.loaded)}`);
  }

  console.log("\n--- Breakdown by source ---");
  for (const r of breakdownBySource) {
    console.log(`${r.source}: loaded=${r.loaded} started=${r.started} purchased=${r.purchased} abandoned=${r.abandoned} cvr=${pct(r.purchased, r.loaded)}`);
  }

  console.log("\n--- Breakdown by device ---");
  for (const r of breakdownByDevice) {
    console.log(`${r.device}: loaded=${r.loaded} started=${r.started} purchased=${r.purchased} cvr=${pct(r.purchased, r.loaded)}`);
  }

  console.log("\n--- Abandonment stages ---");
  console.log(JSON.stringify(abandonment.byStage, null, 2));

  console.log("\n--- Raw counts (diagnostic) ---");
  for (const r of data.rawCounts) {
    console.log(`${r.eventType}: total=${r.total} sessions=${r.uniqueSessions}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
