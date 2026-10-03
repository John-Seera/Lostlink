import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sliders
} from 'lucide-react';
import api from '../services/api';
import { chatWithAI, extractLostItemInfo, calculateMatchScore } from '../services/aiService';
import ItemCard from '../components/ItemCard';
import ClaimModal from '../components/ClaimModal';
import Toast from '../components/Toast';

export default function AIChatbot() {
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I am your LostLink AI Assistant. Describe what you've lost in everyday language (e.g. 'I lost my black wallet near the college library yesterday'). I will parse your description, extract parameters, and search our found registry using weighted similarity matching.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [matchedItems, setMatchedItems] = useState([]);
  const [selectedClaimItem, setSelectedClaimItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [allFoundItems, setAllFoundItems] = useState([]);

  const messagesEndRef = useRef(null);

  // Pre-load found items from registry
  useEffect(() => {
    const fetchFoundItems = async () => {
      try {
        const res = await api.get('/items', { params: { type: 'found', status: 'active' } });
        setAllFoundItems(res.data?.data || []);
      } catch (err) {
        console.warn('Could not pre-fetch found items:', err);
      }
    };
    fetchFoundItems();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Quick preset test cases directly from SRS Appendix F and Appendix G
  const samplePrompts = [
    'I lost my black wallet near the college library yesterday.',
    'I lost my blue water bottle near Block B yesterday.',
    'I misplaced Casio scientific calculator in Seminar Hall 3',
    'I lost my university student ID card in computer lab',
    'I forgot my black backpack in the canteen'
  ];

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // 1. Try backend AI endpoint first
      let aiResult;
      try {
        const res = await api.post('/ai/chat', { message: query });
        if (res.data?.data) {
          aiResult = res.data.data;
        }
      } catch (backendErr) {
        console.warn('Backend AI route failed, using mock client AI fallback:', backendErr);
      }

      // 2. Fallback to client mock AI service if backend was unreachable
      if (!aiResult) {
        aiResult = await chatWithAI(query, allFoundItems);
      }

      const botMsg = {
        id: 'bot_' + Date.now(),
        role: 'assistant',
        text: aiResult.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);

      if (aiResult.extracted) {
        setExtractedData(aiResult.extracted);
      }

      if (aiResult.matches && aiResult.matches.length > 0) {
        setMatchedItems(aiResult.matches);
      } else {
        setMatchedItems([]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          text: 'I encountered an issue processing that query. Please try again or provide more details.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <ClaimModal
        item={selectedClaimItem}
        isOpen={!!selectedClaimItem}
        onClose={() => setSelectedClaimItem(null)}
        onSuccess={() => {
          setToast({
            type: 'success',
            title: 'Claim Submitted',
            message: 'Your verification request has been queued for review.'
          });
        }}
      />

      {/* Page Title & SRS Mapping Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>SRS FR6, FR7, FR8, FR9: Conversational AI & Matching Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">LostLink AI Assistant</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Natural language item extraction and 5-attribute weighted matching algorithm
          </p>
        </div>

        {/* Algorithm Weights Tooltip Badge */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
            <Sliders className="w-3.5 h-3.5" />
            <span>SRS Matching Weights:</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Item 30% • Location 25% • Color 20% • Date 15% • Description 10%
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Chat & Preset Prompts, Right = Structured Extraction & Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Conversational Interface (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-[650px] glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">LostLink AI Bot</h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active • Ready to Assist
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([messages[0]]);
                setExtractedData(null);
                setMatchedItems([]);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              title="Reset conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p>{m.text}</p>
                  <span
                    className={`block text-[10px] mt-2 text-right ${
                      m.role === 'user' ? 'text-blue-200' : 'text-slate-500'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-xs text-purple-400">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 rounded-tl-none flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce delay-150"></span>
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce delay-300"></span>
                  <span className="text-slate-400 ml-1">Analyzing description & computing match scores...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Chips from SRS Appendix F & G */}
          <div className="p-3 bg-slate-950/40 border-t border-slate-800/80">
            <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Sample Demo Prompts (Appendix F):</span>
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  disabled={loading}
                  className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-700/80 transition-colors"
                >
                  "{p.slice(0, 32)}..."
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Describe your missing item in natural language..."
              className="flex-1 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>

        {/* Right Column: Structured Extraction (FR7) & Possible Matches (FR8, FR9) (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* FR7: AI Information Extraction Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Structured AI Extraction (FR7)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                JSON Schema
              </span>
            </div>

            {extractedData ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-500/30 font-mono text-xs text-purple-300 overflow-x-auto">
                  <pre>{JSON.stringify(extractedData, null, 2)}</pre>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Detected Item</span>
                    <span className="font-semibold text-white capitalize">{extractedData.item || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Category</span>
                    <span className="font-semibold text-white capitalize">{extractedData.category || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Color</span>
                    <span className="font-semibold text-white capitalize">{extractedData.color || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Location</span>
                    <span className="font-semibold text-white capitalize">{extractedData.location || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  Send a natural language query in the chat or pick a sample prompt to see real-time AI parameter extraction.
                </p>
              </div>
            )}
          </div>

          {/* FR8 & FR9: Possible Match Recommendations */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Possible Matching Items (FR9)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Calculated using 5-attribute similarity weights
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                {matchedItems.length} Candidate(s)
              </span>
            </div>

            {/* SRS Disclaimer Callout */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>SRS Rule:</strong> A match score represents statistical similarity and is never treated as guaranteed proof of ownership. Claim verification is required.
              </span>
            </div>

            {matchedItems.length > 0 ? (
              <div className="space-y-4">
                {matchedItems.map((candidate, idx) => (
                  <ItemCard
                    key={candidate.item?._id || idx}
                    item={candidate.item}
                    matchScore={candidate.matchScore}
                    matchBreakdown={candidate.breakdown}
                    onClaimClick={(itm) => setSelectedClaimItem(itm)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  No matching items currently identified. Type a prompt like:
                  <br />
                  <span className="text-purple-300 font-mono text-[11px] mt-1 block">
                    "I lost my black wallet near the college library yesterday"
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
