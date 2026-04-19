"use client";
import { useState } from "react";
import { useSendBroadcastMutation, useGetTemplatesQuery } from "@/store/api/allApis";
import { useGetClassesQuery } from "@/store/api/allApis";
import { MessageSquare, Mail, Send, Clock, FileText, Users, BookOpen, Zap, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type Channel = "email" | "whatsapp" | "sms";
type TargetType = "all" | "class" | "section";

const channelConfig: Record<Channel, { label: string; icon: React.ElementType; color: string }> = {
  email: { label: "Email", icon: Mail, color: "text-blue-600" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "text-emerald-600" },
  sms: { label: "SMS", icon: MessageSquare, color: "text-orange-600" },
};

export default function CommunicationPage() {
  const [channels, setChannels] = useState<Channel[]>(["email"]);
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const [sendBroadcast, { isLoading }] = useSendBroadcastMutation();
  const { data: classesData } = useGetClassesQuery();
  const { data: templatesData } = useGetTemplatesQuery();
  const classes = (classesData?.data ?? []) as { _id: string; name: string; sections: string[] }[];
  const templates = (templatesData?.data ?? []) as { id: string; name: string; subject: string; body: string; channels: string[] }[];
  const cls = classes.find((c) => c._id === selectedClass);

  const toggleChannel = (ch: Channel) => {
    setChannels((prev) => prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]);
  };

  const applyTemplate = (t: typeof templates[0]) => {
    setTitle(t.subject);
    setMessage(t.body);
    const validChannels = t.channels.filter((c) => ["email", "whatsapp", "sms"].includes(c)) as Channel[];
    if (validChannels.length > 0) setChannels(validChannels);
  };

  const handleSend = async () => {
    if (!title || !message) return toast.error("Title and message are required");
    if (channels.length === 0) return toast.error("Select at least one channel");
    try {
      const result = await sendBroadcast({
        title, message, channels,
        targetType,
        ...(targetType === "class" && { classId: selectedClass }),
        ...(targetType === "section" && { classId: selectedClass, section: selectedSection }),
      }).unwrap() as { queued?: number; recipients?: number };
      toast.success(`Message queued for ${result?.recipients ?? 0} recipients!`);
      setSent(true);
      setTitle(""); setMessage("");
      setTimeout(() => setSent(false), 3000);
    } catch {
      toast.error("Failed to send broadcast");
    }
  };

  const charCount = message.length;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Communication</h1>
        <p className="page-subtitle">Send messages to students, parents, and teachers</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Compose Panel */}
        <div className="xl:col-span-2 space-y-4">
          {/* Channels */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-3">Send via</h2>
            <div className="flex gap-3 flex-wrap">
              {(Object.entries(channelConfig) as [Channel, typeof channelConfig[Channel]][]).map(([ch, { label, icon: Icon, color }]) => (
                <button key={ch} onClick={() => toggleChannel(ch)}
                  className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                    channels.includes(ch) ? `border-primary bg-primary/10 text-primary` : "border-border hover:bg-accent text-muted-foreground")}>
                  <Icon className="w-4 h-4" />{label}
                  {channels.includes(ch) && <CheckCircle className="w-3.5 h-3.5 ml-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-3">Send to</h2>
            <div className="flex gap-2 mb-3 flex-wrap">
              {([["all", "All Students", Users], ["class", "Specific Class", BookOpen], ["section", "Specific Section", Zap]] as [TargetType, string, React.ElementType][]).map(([val, label, Icon]) => (
                <button key={val} onClick={() => { setTargetType(val); setSelectedClass(""); setSelectedSection(""); }}
                  className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                    targetType === val ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent text-muted-foreground")}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
            {(targetType === "class" || targetType === "section") && (
              <div className="flex gap-3 mt-3">
                <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); }}
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select class</option>
                  {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                {targetType === "section" && (
                  <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} disabled={!cls}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                    <option value="">Select section</option>
                    {cls?.sections.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Message */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold">Message</h2>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Subject / Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fee reminder, Exam schedule..."
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Message body <span className="text-muted-foreground">— use {"{studentName}"}, {"{amount}"}, {"{date}"} as placeholders</span>
              </label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6}
                placeholder="Type your message here..."
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <p className="text-xs text-muted-foreground mt-1 text-right">{charCount} characters {channels.includes("sms") && charCount > 160 && <span className="text-orange-600">({Math.ceil(charCount / 160)} SMS parts)</span>}</p>
            </div>

            <button onClick={handleSend} disabled={isLoading || sent}
              className={cn("w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                sent ? "bg-emerald-600 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60")}>
              {isLoading ? <><Clock className="w-4 h-4 animate-spin" /> Sending...</>
                : sent ? <><CheckCircle className="w-4 h-4" /> Sent successfully!</>
                : <><Send className="w-4 h-4" /> Send Broadcast</>}
            </button>
          </div>
        </div>

        {/* Templates Panel */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Message Templates</h2>
            </div>
            <div className="space-y-2">
              {templates.map((t) => (
                <button key={t.id} onClick={() => applyTemplate(t)}
                  className="w-full text-left p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.body.slice(0, 80)}...</p>
                  <div className="flex gap-1 mt-2">
                    {t.channels.map((ch) => (
                      <span key={ch} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground capitalize">{ch}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Tips</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• WhatsApp messages deliver even if the phone is off</li>
              <li>• SMS works without internet access</li>
              <li>• Use placeholders like {"{studentName}"} for personalization</li>
              <li>• Keep SMS under 160 chars to avoid split messages</li>
              <li>• Schedule messages for off-peak hours for better open rates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
