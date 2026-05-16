import { Navbar } from "@/components/landing/navbar";

export default function SignupCheckoutLayout({
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
