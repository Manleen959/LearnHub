import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCertificateById } from "../services/enrollmentService";
import { QRCodeSVG } from "qrcode.react";
import { Award, Printer, ArrowLeft, CheckCircle2, ShieldCheck, Share2 } from "lucide-react";

export default function CertificatePage() {
  const { certificateId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        setLoading(true);
        const data = await getCertificateById(certificateId);
        setCert(data);
      } catch (e) {
        console.error("Error loading certificate:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [certificateId]);

  const verifyUrl = `${window.location.origin}/verify/${certificateId}`;

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5624d0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium text-sm">Rendering digital certificate...</p>
        </div>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center max-w-md shadow-sm">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Certificate Not Found</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            The requested certificate ID could not be located in our verifiable ledger.
          </p>
          <Link
            to="/student"
            className="inline-flex items-center gap-2 bg-[#5624d0] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#401b9c] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // Format date
  const issueDate = cert.issuedAt?.toDate
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
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 print:p-0 print:bg-white">
      
      {/* Top action toolbar (hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          to="/student"
          className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition bg-white px-3.5 py-2 rounded-lg border border-gray-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Student Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="bg-[#5624d0] hover:bg-[#401b9c] text-white px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Download / Print Certificate</span>
          </button>
        </div>
      </div>

      {/* Certificate Frame Container */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-14 rounded-3xl border-8 border-double border-amber-600/30 shadow-2xl relative overflow-hidden print:border-4 print:shadow-none print:m-0 print:w-full print:rounded-none">
        
        {/* Subtle Watermark Emblem Background */}
        <div className="absolute right-[-40px] bottom-[-40px] opacity-[0.03] pointer-events-none">
          <Award className="w-[450px] h-[450px] text-gray-900" />
        </div>

        {/* Certificate Inner Border */}
        <div className="border border-amber-500/40 p-8 sm:p-12 rounded-xl text-center relative z-10 bg-gradient-to-b from-white via-amber-50/10 to-white">
          
          {/* Header Brand */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#5624d0] text-white flex items-center justify-center font-bold text-xl shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-gray-900">
              Learn<span className="text-[#5624d0]">Hub</span>
            </span>
          </div>

          <div className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-700 mb-2">
            Certificate of Completion & Competence
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif text-gray-900 font-extrabold tracking-tight mb-4">
            Official Certification
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 italic mb-8">
            This is to formally certify that
          </p>

          {/* Student Name */}
          <div className="border-b-2 border-gray-900/80 pb-2 mb-6 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 font-serif tracking-wide text-center">
              {cert.studentName}
            </h2>
          </div>

          <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed mb-6">
            has successfully completed all required lectures, demonstrations, and demonstrated comprehensive subject mastery by passing the AI-evaluated examination for:
          </p>

          {/* Course Title */}
          <h3 className="text-xl sm:text-2xl font-bold text-[#5624d0] max-w-2xl mx-auto mb-10 leading-snug">
            "{cert.courseTitle}"
          </h3>

          {/* Footer Details: Date, QR Code, Verification Seal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center pt-8 border-t border-gray-200 mt-10">
            
            {/* Issue Date & Score */}
            <div className="text-left text-xs space-y-1">
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                Date of Issue
              </p>
              <p className="font-bold text-gray-900">{issueDate}</p>
              <p className="text-emerald-700 font-extrabold">Exam Score: {cert.score}% (Passed)</p>
            </div>

            {/* Verifiable QR Code */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-xs">
                <QRCodeSVG value={verifyUrl} size={92} level="M" />
              </div>
              <span className="text-[10px] text-gray-400 mt-1.5 font-mono">
                Scan to Verify Credential
              </span>
            </div>

            {/* Institutional Seal */}
            <div className="sm:text-right text-xs space-y-1">
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                Certificate ID
              </p>
              <p className="font-mono text-gray-700 text-[11px] truncate">{certificateId}</p>
              <div className="inline-flex items-center gap-1 text-[#5624d0] font-bold text-xs pt-1">
                <ShieldCheck className="w-4 h-4 text-[#5624d0]" />
                <span>Verified Online</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
