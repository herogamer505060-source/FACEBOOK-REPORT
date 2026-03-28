import React, { useState, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, 
  AlertCircle, CheckCircle2, Download, Filter, 
  Calendar, ArrowUpRight, ArrowDownRight, Info,
  LayoutDashboard, PieChart as PieChartIcon, ListChecks, FileText,
  Upload, Loader2, FileSpreadsheet, FileJson, Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import * as XLSX from 'xlsx';
import { GoogleGenAI, Type } from "@google/genai";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Translations ---

const translations = {
  en: {
    title: "Marketing Finance",
    subtitle: "Management View • Feb 2026",
    upload: "Upload Report",
    processing: "Processing...",
    export: "Export PDF",
    overview: "Overview",
    projects: "Projects",
    performance: "Performance",
    audit: "Audit & Risks",
    totalBilled: "Total Meta Billed",
    vatIncluded: "Includes 14% VAT",
    fundsAdded: "Funds Added (Wallet)",
    prepaid: "Pre-paid to accounts",
    fundingGap: "Funding Gap",
    uncovered: "Uncovered balance",
    coverage: "Funding Coverage",
    ratio: "Funds vs Billed ratio",
    dailyMovement: "Daily Financial Movement",
    billedVsTopup: "Billed charges vs Wallet top-ups",
    objectives: "Campaign Objectives",
    spendByGoal: "Spend distribution by goal",
    projectAllocation: "Project Spending Allocation",
    internalVsMeta: "Internal budget vs Estimated Meta-loaded cost",
    projectName: "Project Name",
    internalBudget: "Internal Budget",
    share: "Share %",
    estMetaCost: "Est. Meta Cost",
    campaignAudit: "Campaign Performance Audit",
    campaign: "Campaign",
    account: "Account",
    spend: "Spend",
    ctr: "CTR",
    cpc: "CPC",
    status: "Status",
    strengths: "Strengths & Opportunities",
    weaknesses: "Weaknesses & Financial Risks",
    footer: "© 2026 Finance & Management View • AI-Powered Dynamic Dashboard",
    reportDate: "Report Date: March 28, 2026",
    billedLabel: "Billed Charges",
    topupLabel: "Wallet Top-ups",
    internalLabel: "Internal Allocation",
    metaLabel: "Est. Meta Cost",
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    poor: "Poor"
  },
  ar: {
    title: "مالية التسويق",
    subtitle: "عرض الإدارة • فبراير 2026",
    upload: "رفع التقرير",
    processing: "جاري المعالجة...",
    export: "تصدير PDF",
    overview: "نظرة عامة",
    projects: "المشاريع",
    performance: "الأداء",
    audit: "التدقيق والمخاطر",
    totalBilled: "إجمالي فاتورة ميتا",
    vatIncluded: "شامل 14% ضريبة",
    fundsAdded: "المبالغ المشحونة (المحفظة)",
    prepaid: "مدفوع مسبقاً للحسابات",
    fundingGap: "العجز التمويلي",
    uncovered: "الرصيد غير المغطى",
    coverage: "تغطية التمويل",
    ratio: "نسبة الشحن للفواتير",
    dailyMovement: "الحركة المالية اليومية",
    billedVsTopup: "الفواتير مقابل شحن المحفظة",
    objectives: "أهداف الحملات",
    spendByGoal: "توزيع الصرف حسب الهدف",
    projectAllocation: "توزيع صرف المشاريع",
    internalVsMeta: "الميزانية الداخلية مقابل تكلفة ميتا التقديرية",
    projectName: "اسم المشروع",
    internalBudget: "الميزانية الداخلية",
    share: "الحصة %",
    estMetaCost: "تكلفة ميتا التقديرية",
    campaignAudit: "تدقيق أداء الحملات",
    campaign: "الحملة",
    account: "الحساب",
    spend: "الصرف",
    ctr: "معدل النقر",
    cpc: "تكلفة النقرة",
    status: "الحالة",
    strengths: "نقاط القوة والفرص",
    weaknesses: "نقاط الضعف والمخاطر المالية",
    footer: "© 2026 عرض المالية والإدارة • لوحة بيانات ديناميكية بالذكاء الاصطناعي",
    reportDate: "تاريخ التقرير: 28 مارس 2026",
    billedLabel: "الفواتير",
    topupLabel: "شحن المحفظة",
    internalLabel: "الميزانية الداخلية",
    metaLabel: "تكلفة ميتا",
    excellent: "ممتاز",
    good: "جيد",
    fair: "متوسط",
    poor: "ضعيف"
  }
};

// --- Types ---

interface FinancialSummary {
  totalBilled: number;
  fundsAdded: number;
  netSpend: number;
  vat: number;
  fundingGap: number;
  coveragePercent: number;
}

interface ProjectData {
  name: string;
  internal: number;
  estimated: number;
  share: number;
}

interface ObjectiveData {
  name: string;
  value: number;
  color: string;
}

interface DailyData {
  date: string;
  billed: number;
  topup: number;
}

interface Campaign {
  name: string;
  account: string;
  spend: number;
  clicks: number;
  ctr: number;
  cpc: number;
  status: string;
}

// --- Initial Mock Data ---

const INITIAL_FINANCIAL: FinancialSummary = {
  totalBilled: 196831.48,
  fundsAdded: 130000.00,
  netSpend: 172659.19,
  vat: 24172.29,
  fundingGap: 66831.48,
  coveragePercent: 66.0,
};

const INITIAL_PROJECTS: ProjectData[] = [
  { name: 'CAZA MALL', internal: 65999.61, estimated: 78334.84, share: 39.8 },
  { name: 'Il Centro', internal: 70529.68, estimated: 83711.57, share: 42.5 },
  { name: 'Il Parco', internal: 25600.75, estimated: 30385.49, share: 15.4 },
  { name: 'Fayoum Expo', internal: 3706.79, estimated: 4399.58, share: 2.2 },
];

const INITIAL_OBJECTIVES: ObjectiveData[] = [
  { name: 'Awareness', value: 53.6, color: '#0ea5e9' },
  { name: 'Lead Gen', value: 43.9, color: '#f59e0b' },
  { name: 'Engagement', value: 2.5, color: '#10b981' },
];

const INITIAL_DAILY: DailyData[] = [
  { date: '02-01', billed: 10000, topup: 0 },
  { date: '02-03', billed: 18000, topup: 0 },
  { date: '02-05', billed: 16000, topup: 0 },
  { date: '02-07', billed: 15000, topup: 0 },
  { date: '02-08', billed: 7000, topup: 80000 },
  { date: '02-09', billed: 20522, topup: 0 },
  { date: '02-11', billed: 18500, topup: 50000 },
  { date: '02-13', billed: 16000, topup: 0 },
  { date: '02-15', billed: 3000, topup: 0 },
  { date: '02-17', billed: 4000, topup: 0 },
  { date: '02-25', billed: 10000, topup: 0 },
  { date: '02-28', billed: 5000, topup: 0 },
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  { name: 'General - Hadeer 31/1', account: 'HIG ADS 1', spend: 26174.91, clicks: 4615, ctr: 1.95, cpc: 5.67, status: 'Good' },
  { name: 'General - Hadeer 29/1', account: 'HIG ADS 1', spend: 20736.11, clicks: 2400, ctr: 1.58, cpc: 8.64, status: 'Good' },
  { name: 'Lead Centro 03-02', account: 'HIG ADS 4', spend: 18251.71, clicks: 1252, ctr: 1.37, cpc: 14.58, status: 'Fair' },
  { name: 'Lead Caza 08-02', account: 'HIG ADS 4', spend: 18072.36, clicks: 3254, ctr: 1.28, cpc: 5.55, status: 'Fair' },
  { name: 'Lead 01-02', account: 'HIG ADS 4', spend: 17729.48, clicks: 1654, ctr: 1.83, cpc: 10.72, status: 'Good' },
  { name: 'Engagement Il Centro 1/2', account: 'HIG ADS 1', spend: 979.13, clicks: 1445, ctr: 4.34, cpc: 0.68, status: 'Excellent' },
];

// --- Components ---

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, trend }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2 rounded-xl", colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <span className={cn(
          "flex items-center text-xs font-medium px-2 py-1 rounded-full",
          trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <div className="text-2xl font-bold text-slate-900 mb-1">
      {typeof value === 'number' ? `EGP ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : value}
    </div>
    <p className="text-slate-400 text-xs">{subtitle}</p>
  </motion.div>
);

const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
  </div>
);

export default function App() {
  const [lang, setLang] = useState<'en' | 'ar'>('ar');
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [activeTab, setActiveTab] = useState('overview');
  const [financials, setFinancials] = useState<FinancialSummary>(INITIAL_FINANCIAL);
  const [projects, setProjects] = useState<ProjectData[]>(INITIAL_PROJECTS);
  const [objectives, setObjectives] = useState<ObjectiveData[]>(INITIAL_OBJECTIVES);
  const [dailyData, setDailyData] = useState<DailyData[]>(INITIAL_DAILY);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    setIsProcessing(true);
    setUploadStatus(isRtl ? "جاري تصدير التقرير..." : "Exporting report...");

    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
        onclone: (clonedDoc) => {
          // Force all elements to use safe colors if they might be using oklch/oklab
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * { 
              border-color: #e2e8f0 !important; 
              outline-color: #e2e8f0 !important;
              ring-color: #3b82f6 !important;
              background-image: none !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Handle multi-page if content is too long
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Facebook-Ads-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      setUploadStatus(isRtl ? "تم التصدير بنجاح!" : "Exported successfully!");
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error("PDF Export Error:", error);
      setUploadStatus(isRtl ? "خطأ في التصدير" : "Export error");
    } finally {
      setIsProcessing(false);
    }
  };

  const processFileWithGemini = async (content: string, mimeType: string, isText: boolean = false) => {
    setIsProcessing(true);
    setUploadStatus(isRtl ? "جاري تحليل البيانات بالذكاء الاصطناعي..." : "Analyzing data with AI...");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `
        You are a Marketing Finance Expert. I am providing you with data extracted from a Facebook Ads report (${mimeType}).
        Extract the following structured data from it. 
        
        Return the data in the following JSON format ONLY:
        {
          "financials": { "totalBilled": number, "fundsAdded": number, "netSpend": number, "vat": number, "fundingGap": number, "coveragePercent": number },
          "projects": [ { "name": string, "internal": number, "estimated": number, "share": number } ],
          "objectives": [ { "name": string, "value": number } ],
          "dailyData": [ { "date": string, "billed": number, "topup": number } ],
          "campaigns": [ { "name": string, "account": string, "spend": number, "clicks": number, "ctr": number, "cpc": number, "status": string } ]
        }
        
        If the data is provided as text, parse it carefully. If it's an image/PDF, analyze the visual tables.
        Ensure all numbers are parsed correctly.
      `;

      let response;
      if (isText) {
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts: [{ text: prompt + "\n\nData Content:\n" + content }] }],
          config: { responseMimeType: "application/json" }
        });
      } else {
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            { parts: [{ text: prompt }] },
            { parts: [{ inlineData: { data: content, mimeType: mimeType } }] }
          ],
          config: { responseMimeType: "application/json" }
        });
      }

      const result = JSON.parse(response.text || "{}");
      
      if (result.financials) setFinancials(result.financials);
      if (result.projects) setProjects(result.projects);
      if (result.objectives) {
        const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];
        setObjectives(result.objectives.map((obj: any, i: number) => ({ 
          ...obj, 
          color: obj.color || colors[i % colors.length] 
        })));
      }
      if (result.dailyData) setDailyData(result.dailyData);
      if (result.campaigns) setCampaigns(result.campaigns);

      setUploadStatus(isRtl ? "تم تحديث لوحة البيانات بنجاح!" : "Dashboard updated successfully!");
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error("Gemini Error:", error);
      setUploadStatus(isRtl ? "خطأ في معالجة البيانات" : "Error processing data");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadStatus(isRtl ? `جاري قراءة ${file.name}...` : `Reading ${file.name}...`);

    const reader = new FileReader();

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          const textContent = JSON.stringify(json, null, 2);
          await processFileWithGemini(textContent, "text/json", true);
        } catch (err) {
          setUploadStatus(isRtl ? "خطأ في قراءة ملف إكسيل" : "Error reading Excel file.");
          setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type === 'application/pdf') {
      reader.onload = async (e) => {
        const base64Data = (e.target?.result as string).split(',')[1];
        await processFileWithGemini(base64Data, file.type, false);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadStatus(isRtl ? "نوع ملف غير مدعوم" : "Unsupported file type.");
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-slate-50 text-slate-900 font-sans pb-20", isRtl ? "font-arabic" : "")} dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t.title}</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Languages className="w-4 h-4" />
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.xlsx,.xls,.csv"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all shadow-sm disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span className="hidden sm:inline">{isProcessing ? t.processing : t.upload}</span>
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={isProcessing}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {t.export}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={dashboardRef}>
        {/* Status Notification */}
        <AnimatePresence>
          {uploadStatus && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "mb-6 p-4 rounded-xl flex items-center gap-3 border no-print",
                uploadStatus.includes("Error") || uploadStatus.includes("خطأ") ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"
              )}
            >
              {uploadStatus.includes("Error") || uploadStatus.includes("خطأ") ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              <span className="text-sm font-medium">{uploadStatus}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-1 mb-8 bg-[rgba(226,232,240,0.5)] p-1 rounded-xl w-fit no-print">
          {[
            { id: 'overview', label: t.overview, icon: LayoutDashboard },
            { id: 'projects', label: t.projects, icon: PieChartIcon },
            { id: 'performance', label: t.performance, icon: Target },
            { id: 'audit', label: t.audit, icon: AlertCircle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-[rgba(255,255,255,0.5)]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-12">
          {/* Overview Section */}
          {(activeTab === 'overview' || isProcessing) && (
            <section className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title={t.totalBilled} 
                  value={financials.totalBilled} 
                  subtitle={t.vatIncluded}
                  icon={DollarSign}
                  colorClass="bg-blue-50 text-blue-600"
                />
                <StatCard 
                  title={t.fundsAdded} 
                  value={financials.fundsAdded} 
                  subtitle={t.prepaid}
                  icon={TrendingUp}
                  colorClass="bg-emerald-50 text-emerald-600"
                />
                <StatCard 
                  title={t.fundingGap} 
                  value={financials.fundingGap} 
                  subtitle={t.uncovered}
                  icon={AlertCircle}
                  colorClass="bg-rose-50 text-rose-600"
                />
                <StatCard 
                  title={t.coverage} 
                  value={`${financials.coveragePercent}%`} 
                  subtitle={t.ratio}
                  icon={Info}
                  colorClass="bg-slate-100 text-slate-600"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <SectionHeader title={t.dailyMovement} subtitle={t.billedVsTopup} />
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} orientation={isRtl ? "right" : "left"} />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            backgroundColor: '#ffffff',
                            color: '#0f172a'
                          }}
                        />
                        <Legend verticalAlign="top" align={isRtl ? "left" : "right"} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                        <Bar name={t.billedLabel} dataKey="billed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Line name={t.topupLabel} type="monotone" dataKey="topup" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <SectionHeader title={t.objectives} subtitle={t.spendByGoal} />
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={objectives}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {objectives.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            backgroundColor: '#ffffff',
                            color: '#0f172a'
                          }}
                        />
                        <Legend verticalAlign="bottom" align="center" iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Projects Section */}
          {(activeTab === 'projects' || isProcessing) && (
            <section className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <SectionHeader title={t.projectAllocation} subtitle={t.internalVsMeta} />
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projects} layout="vertical" margin={{ left: isRtl ? 0 : 40, right: isRtl ? 40 : 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} orientation={isRtl ? "right" : "left"} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          backgroundColor: '#ffffff',
                          color: '#0f172a'
                        }}
                      />
                      <Legend />
                      <Bar name={t.internalLabel} dataKey="internal" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                      <Bar name={t.metaLabel} dataKey="estimated" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className={cn("px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", isRtl ? "text-right" : "text-left")}>{t.projectName}</th>
                      <th className={cn("px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", isRtl ? "text-left" : "text-right")}>{t.internalBudget}</th>
                      <th className={cn("px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", isRtl ? "text-left" : "text-right")}>{t.share}</th>
                      <th className={cn("px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", isRtl ? "text-left" : "text-right")}>{t.estMetaCost}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projects.map((project) => (
                      <tr key={project.name} className="hover:bg-[rgba(248,250,252,0.5)] transition-colors">
                        <td className={cn("px-6 py-4 font-medium text-slate-900", isRtl ? "text-right" : "text-left")}>{project.name}</td>
                        <td className={cn("px-6 py-4 text-slate-600", isRtl ? "text-left" : "text-right")}>EGP {project.internal.toLocaleString()}</td>
                        <td className={cn("px-6 py-4", isRtl ? "text-left" : "text-right")}>
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                            {project.share}%
                          </span>
                        </td>
                        <td className={cn("px-6 py-4 font-semibold text-slate-900", isRtl ? "text-left" : "text-right")}>EGP {project.estimated.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Performance Section */}
          {(activeTab === 'performance' || isProcessing) && (
            <section className="space-y-8">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-lg">{t.campaignAudit}</h3>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className={cn("px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", isRtl ? "text-right" : "text-left")}>{t.campaign}</th>
                      <th className={cn("px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", isRtl ? "text-right" : "text-left")}>{t.account}</th>
                      <th className={cn("px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", isRtl ? "text-left" : "text-right")}>{t.spend}</th>
                      <th className={cn("px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", isRtl ? "text-left" : "text-right")}>{t.ctr}</th>
                      <th className={cn("px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider", isRtl ? "text-left" : "text-right")}>{t.cpc}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaigns.map((camp) => (
                      <tr key={camp.name} className="hover:bg-[rgba(248,250,252,0.5)] transition-colors">
                        <td className={cn("px-6 py-4 font-medium text-slate-900", isRtl ? "text-right" : "text-left")}>{camp.name}</td>
                        <td className={cn("px-6 py-4 text-slate-500 text-sm", isRtl ? "text-right" : "text-left")}>{camp.account}</td>
                        <td className={cn("px-6 py-4 font-semibold", isRtl ? "text-left" : "text-right")}>EGP {camp.spend.toLocaleString()}</td>
                        <td className={cn("px-6 py-4 text-slate-600", isRtl ? "text-left" : "text-right")}>{camp.ctr}%</td>
                        <td className={cn("px-6 py-4 text-slate-600", isRtl ? "text-left" : "text-right")}>EGP {camp.cpc}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            camp.status === 'Excellent' || camp.status === 'Good' || camp.status === 'ممتاز' || camp.status === 'جيد' ? "bg-emerald-100 text-emerald-700" :
                            "bg-amber-100 text-amber-700"
                          )}>
                            {camp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Audit Section */}
          {(activeTab === 'audit' || isProcessing) && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <SectionHeader title={t.strengths} />
                <div className="space-y-4">
                  {[
                    isRtl ? "حسابات إعلانية مزدوجة: يقلل من مخاطر توقف الحملات بالكامل." : "Dual Ad Accounts: Redundancy reduces risk of total campaign shutdown.",
                    isRtl ? "تفاعل عالٍ: تحقق الحملات الرئيسية صدى إبداعياً ممتازاً مع معدل نقر > 4%." : "High Engagement: Top campaigns show excellent creative resonance with >4% CTR.",
                    isRtl ? "تنوع الأهداف: مزيج متوازن بين الوعي وجذب العملاء المحتملين." : "Objective Diversity: Balanced mix between Awareness and Lead Gen.",
                    isRtl ? "كفاءة التكلفة: تكلفة منخفضة للنقرة في المجموعات الأعلى أداءً." : "Cost Efficiency: Low CPC on top-performing sets."
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-[rgba(236,253,245,0.5)] border border-emerald-100 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <p className="text-sm text-emerald-800">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <SectionHeader title={t.weaknesses} />
                <div className="space-y-4">
                  {[
                    isRtl ? `فجوة التمويل: EGP ${financials.fundingGap.toLocaleString()} من الفواتير الحالية غير مغطاة بأموال المحفظة.` : `Funding Gap: EGP ${financials.fundingGap.toLocaleString()} of current billing is not covered by wallet funds.`,
                    isRtl ? "فجوات البيانات: نقص بيانات ROAS/CPL يمنع التقييم الكامل للعائد." : "Data Gaps: Missing ROAS/CPL data prevents full ROI assessment.",
                    isRtl ? "إجهاد إبداعي: تظهر بعض حملات الوعي علامات انخفاض في التفاعل." : "Creative Fatigue: Some awareness campaigns showing signs of low interaction.",
                    isRtl ? "اختلاف التقارير: تباين محتمل بين تقارير الميزانية والصادرات." : "Reporting Discrepancy: Potential variance between budget reports and exports."
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-[rgba(255,241,242,0.5)] border border-rose-100 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <p className="text-sm text-rose-800">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-8 py-10 border-t border-slate-200 text-slate-400 text-xs flex justify-between">
        <p>{t.footer}</p>
        <p className="hidden sm:block">{t.reportDate}</p>
      </footer>
    </div>
  );
}
