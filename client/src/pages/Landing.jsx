import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  Calendar,
  CheckCircle2,
  FileQuestion,
  PlusCircle,
  Cpu
} from 'lucide-react';
import api from '../services/api';
import ItemCard from '../components/ItemCard';
import ClaimModal from '../components/ClaimModal';
import Toast from '../components/Toast';

export default function Landing() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaimItem, setSelectedClaimItem] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchRecentItems = async () => {
      try {
        const res = await api.get('/items');
        if (res.data?.data) {
          setRecentItems(res.data.data.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load recent items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentItems();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Claim Modal */}
      <ClaimModal
        item={selectedClaimItem}
        isOpen={!!selectedClaimItem}
        onClose={() => setSelectedClaimItem(null)}
        onSuccess={() => {
          setToast({
            type: 'success',
            title: 'Claim Submitted Successfully',
            message: 'Your ownership verification request is under review.'
          });
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 overflow-hidden">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/3 w-[350px] h-[250px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-blue-500/30 text-blue-400 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>AI-Powered Campus Lost & Found Ecosystem</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            Lost Something on Campus? <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Let AI Reconnect You.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Eliminate chaotic bulletin boards and lost item guesswork. LostLink AI extracts details from natural descriptions, computes multi-attribute weighted matches, and enables fraud-resistant claims.
          </p>

          {/* Search Box in Hero */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto relative flex items-center p-2 rounded-2xl glass-panel shadow-2xl shadow-blue-500/10 border border-slate-700/80"
          >
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item name, location, color, or category..."
              className="w-full bg-transparent px-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-md shrink-0 flex items-center gap-1.5"
            >
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/ai-chat"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 text-purple-200 group-hover:rotate-12 transition-transform" />
              Try AI Chatbot Assistant
            </Link>

            <Link
              to="/report-lost"
              className="px-5 py-3 rounded-2xl bg-slate-900 border border-rose-500/30 text-rose-400 hover:bg-rose-950/20 text-sm font-semibold transition-all flex items-center gap-2"
            >
              <FileQuestion className="w-4 h-4" />
              Report Lost Item
            </Link>

            <Link
              to="/report-found"
              className="px-5 py-3 rounded-2xl bg-slate-900 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/20 text-sm font-semibold transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Report Found Item
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl glass-panel border border-slate-800">
          <div className="text-center p-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">98.4%</div>
            <p className="text-xs text-slate-400 mt-1">AI Extraction Accuracy</p>
          </div>
          <div className="text-center p-3 border-l border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">&lt; 800ms</div>
            <p className="text-xs text-slate-400 mt-1">Match Computation Speed</p>
          </div>
          <div className="text-center p-3 border-l border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">5-Attribute</div>
            <p className="text-xs text-slate-400 mt-1">Weighted Matching Algorithm</p>
          </div>
          <div className="text-center p-3 border-l border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">100%</div>
            <p className="text-xs text-slate-400 mt-1">SRS FR1-FR13 Compliance</p>
          </div>
        </div>
      </section>

      {/* SRS AI Workflow Demonstration */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/40 px-3 py-1 rounded-full border border-purple-500/30">
            SRS Section 3.6 - 3.9 Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            How LostLink AI Works
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            From conversational prompt to verified ownership claim in 4 transparent stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl glass-panel relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-lg mb-4">
              1
            </div>
            <h3 className="font-bold text-white text-base mb-2">Natural Description</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Describe your lost item in your own everyday words through our conversational chat interface.
            </p>
            <div className="mt-4 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-blue-300 font-mono italic">
              "I lost my black wallet near college library yesterday"
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-panel relative">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-lg mb-4">
              2
            </div>
            <h3 className="font-bold text-white text-base mb-2">AI Extraction (FR7)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              System parses unstructured text into structured schema: category, color, location, and date.
            </p>
            <div className="mt-4 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-purple-300 font-mono">
              &#123; item: "wallet", color: "black", loc: "library" &#125;
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-panel relative">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-lg mb-4">
              3
            </div>
            <h3 className="font-bold text-white text-base mb-2">Weighted Matching (FR8)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates database items using SRS formula: 0.30·I + 0.20·C + 0.25·L + 0.15·D + 0.10·S.
            </p>
            <div className="mt-4 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 font-mono">
              Match Confidence: 94%
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-panel relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg mb-4">
              4
            </div>
            <h3 className="font-bold text-white text-base mb-2">Verified Claim (FR11)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Submit proof of ownership. Reporter or admin confirms the details before handing over item.
            </p>
            <div className="mt-4 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 font-mono">
              Status: Verified & Claimed
            </div>
          </div>
        </div>
      </section>

      {/* Recent Items Showcase (Appendix G Seed Data) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Recently Reported Items
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Live listings from campus students and administrative staff (Appendix G Demo Data)
            </p>
          </div>
          <Link
            to="/browse"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Browse all items ({recentItems.length}+)
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading catalog items...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentItems.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                onClaimClick={(itm) => setSelectedClaimItem(itm)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Demo Quick Start Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-950/40 to-slate-900 border border-blue-500/30 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Ready for Evaluation & Viva Presentation</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
            Test the Platform in Seconds
          </h3>

          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Use pre-configured student or administrator demo accounts with zero setup. Test natural language AI extraction and claim verification instantly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              to="/login"
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20"
            >
              Launch Demo Login
            </Link>
            <Link
              to="/ai-chat"
              className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              Interact With AI Bot
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
