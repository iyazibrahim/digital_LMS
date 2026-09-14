import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Certificate } from "@/models/Certificate";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await connectDB();
  const cert = await Certificate.findOne({
    $or: [{ verificationCode: code.toUpperCase() }, { certificateNumber: code.toUpperCase() }],
  }).lean();

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Certificate verification</CardTitle>
        </CardHeader>
        <CardContent>
          {cert ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-700">Valid certificate</p>
              <p className="text-lg font-serif text-stone-900">{cert.recipientName}</p>
              <p className="text-stone-600">{cert.courseTitle}</p>
              <p className="text-sm text-stone-500">
                Issued {formatDate(cert.issuedAt)} · {cert.certificateNumber}
              </p>
              {cert.verificationCode && (
                <p className="font-mono text-xs text-stone-400">{cert.verificationCode}</p>
              )}
              <Link
                href={`/certificates/${cert._id}`}
                className="inline-block text-sm text-blue-700 hover:underline"
              >
                View certificate
              </Link>
            </div>
          ) : (
            <p className="text-stone-600">
              No certificate found for code <span className="font-mono">{code}</span>.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
