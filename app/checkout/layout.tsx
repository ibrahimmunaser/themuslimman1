import { Navbar } from "@/components/landing/navbar";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide the global nav on mobile — checkout has its own "Back to pricing" link
          which is sufficient. Desktop keeps it for brand trust/reassurance. */}
      <div className="hidden sm:block">
        <Navbar />
      </div>
      <div>
        {children}
      </div>
    </>
  );
}
