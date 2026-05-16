import { Navbar } from "@/components/landing/navbar";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div>
        {children}
      </div>
    </>
  );
}
