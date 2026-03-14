import { PublicSectionPage } from "@/components/shared/PublicSectionPage";

export default function VerifyEmailPage() {
  return (
    <PublicSectionPage
      title="Verify Your Email"
      description="A verification link has been sent to your inbox. Once confirmed, your tenant environment will be activated."
      bullets={[
        "Check inbox and spam folders",
        "Click the secure verification link",
        "Return to login and access dashboard",
      ]}
      imageSrc="/visuals/module-console.svg"
      imageAlt="Email verification visual"
    />
  );
}
