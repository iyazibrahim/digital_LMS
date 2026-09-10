import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Certificate } from "@/models/Certificate";
import { getSettings } from "@/models/Settings";
import { renderCertificateHtml } from "@/lib/progress";
import { isStaff } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/ui/print-button";

export const dynamic = "force-dynamic";

export default async function CertificatePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  await connectDB();
  const certificate = await Certificate.findById(id).lean();
  if (!certificate) notFound();

  if (!isStaff(session.roles) && String(certificate.userId) !== session.sub) {
    notFound();
  }

  const settings = await getSettings();
  const html = renderCertificateHtml(settings.defaultCertificateHtml, {
    recipientName: certificate.recipientName,
    courseTitle: certificate.courseTitle,
    issuedAt: formatDate(certificate.issuedAt),
    certificateNumber: certificate.certificateNumber,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="font-serif text-2xl text-blue-950">Certificate</h1>
          <p className="text-sm text-stone-500">{certificate.certificateNumber}</p>
        </div>
        <PrintButton />
      </div>
      <div
        className="certificate-print rounded-xl bg-white p-4 shadow-sm print:shadow-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
