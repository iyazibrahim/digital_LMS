import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Certificate } from "@/models/Certificate";
import { getCertificateRenderSource, renderCertificateHtml } from "@/lib/progress";
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

  const source = await getCertificateRenderSource(certificate.templateId?.toString());
  const html = renderCertificateHtml(
    source.html,
    {
      recipientName: certificate.recipientName,
      courseTitle: certificate.courseTitle,
      issuedAt: formatDate(certificate.issuedAt),
      certificateNumber: certificate.certificateNumber,
      backgroundImageUrl: source.backgroundImageUrl,
    },
    source.css || ""
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-serif text-2xl text-blue-950">Certificate</h1>
          <p className="text-sm text-stone-500">{certificate.certificateNumber}</p>
          {certificate.verificationCode && (
            <p className="text-xs text-stone-400">
              Verify:{" "}
              <a
                className="text-blue-700 hover:underline"
                href={`/verify/${certificate.verificationCode}`}
              >
                /verify/{certificate.verificationCode}
              </a>
            </p>
          )}
        </div>
        <PrintButton />
      </div>
      <iframe
        title="Certificate"
        className="min-h-[640px] w-full rounded-xl border border-stone-200 bg-white"
        srcDoc={html}
      />
    </div>
  );
}
