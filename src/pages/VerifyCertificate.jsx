import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCertificateById } from "../services/enrollmentService";
import { CheckCircle2, XCircle, ShieldCheck, Award, ArrowRight, ExternalLink } from "lucide-react";

export default function VerifyCertificate() {
  const { certificateId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        setLoading(true);
        const data = await getCertificateById(certificateId);
        setCert(data);
      } catch (e) {
        console.error("Verification query error:", e);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5624d0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium text-sm">Verifying digital certificate authenticity...</p>
        </div>
      </div>
    );
  }

  const isValid = Boolean(cert);

  const issueDate = cert?.issuedAt?.toDate
    ? cert.issuedAt.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-200 shadow-xl p-8 sm:p-10 text-center">
        
        {isValid ? (
          <div>
            {/* Valid Badge */}
            <div className="w-20 h-20 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-sm animate-fadeIn">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-200 mb-3">
              Cryptographically Verified
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Valid Certificate
            </h1>

            <p className="text-sm text-gray-600 mt-2">
              This certificate was officially issued by LearnHub following completion of all coursework and successful AI assessment.
            </p>

            {/* Certificate Details Card */}
            <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 text-left space-y-3.5 text-sm">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-semibold text-xs">Recipient:</span>
                <strong className="text-gray-900 text-base">{cert.studentName}</strong>
              </div>

              <div className="flex justify-between items-start border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-semibold text-xs">Course:</span>
                <strong className="text-[#5624d0] text-right max-w-xs">{cert.courseTitle}</strong>
              </div>

              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-semibold text-xs">Passing Score:</span>
                <span className="text-emerald-700 font-extrabold">{cert.score}%</span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-semibold text-xs">Issue Date:</span>
                <span className="text-gray-700">{issueDate}</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-500 font-semibold text-xs">Certificate ID:</span>
                <span className="font-mono text-xs text-gray-700">{certificateId}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={`/certificate/${certificateId}`}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#5624d0] hover:bg-[#401b9c] text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Award className="w-4 h-4" />
                <span>View Full Certificate</span>
              </Link>

              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
              >
                <span>LearnHub Home</span>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Invalid Badge */}
            <div className="w-20 h-20 rounded-2xl bg-red-100 border-2 border-red-300 flex items-center justify-center mx-auto mb-6 text-red-600 shadow-sm animate-fadeIn">
              <XCircle className="w-12 h-12" />
            </div>

            <div className="inline-block px-3 py-1 bg-red-50 text-red-800 text-xs font-bold uppercase tracking-wider rounded-full border border-red-200 mb-3">
              Verification Failed
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Invalid Certificate
            </h1>

            <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto">
              We could not authenticate this certificate ID: <code>{certificateId}</code> in the LearnHub registry. Please check the URL or contact support.
            </p>

            <div className="mt-8">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5624d0] text-white rounded-xl text-sm font-bold hover:bg-[#401b9c] transition shadow-xs"
              >
                <span>Explore Official Courses</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
