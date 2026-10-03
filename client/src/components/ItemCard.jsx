import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, Sparkles, ChevronRight, CheckCircle, ShieldAlert } from 'lucide-react';

export default function ItemCard({ item, matchScore, matchBreakdown, onClaimClick }) {
  if (!item) return null;

  const isLost = item.type === 'lost';

  const statusStyles = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    matched: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    claimed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    closed: 'bg-slate-700/30 text-slate-400 border-slate-700/50'
  };

  const formattedDate = item.date
    ? new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Unknown date';

  return (
    <div className="group rounded-2xl glass-panel-subtle hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 flex flex-col overflow-hidden">
      {/* Header Image or Graphic */}
      <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-center">
            <Tag className="w-10 h-10 text-slate-600 mb-2" />
            <span className="text-xs text-slate-500">{item.category}</span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md backdrop-blur-md ${
              isLost
                ? 'bg-rose-500/90 text-white border border-rose-400/30'
                : 'bg-emerald-600/90 text-white border border-emerald-400/30'
            }`}
          >
            {item.type}
          </span>
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border capitalize backdrop-blur-md ${
              statusStyles[item.status] || statusStyles.active
            }`}
          >
            {item.status}
          </span>
        </div>

        {/* Optional AI Match Score Badge (FR9) */}
        {matchScore !== undefined && matchScore !== null && (
          <div className="absolute top-3 right-3">
            <div className="px-2.5 py-1 rounded-lg bg-purple-950/90 border border-purple-500/50 backdrop-blur-md shadow-lg flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="text-xs font-bold text-purple-300">
                {matchScore}% Match
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-white text-base group-hover:text-blue-400 transition-colors line-clamp-1">
            {item.title}
          </h3>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 mb-4 flex-1">
          {item.description}
        </p>

        {/* Weighted breakdown if provided */}
        {matchBreakdown && (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/20 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Item: {matchBreakdown.itemCategory}%</span>
              <span>Color: {matchBreakdown.color}%</span>
              <span>Loc: {matchBreakdown.location}%</span>
              <span>Date: {matchBreakdown.date}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full"
                style={{ width: `${matchScore}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Metadata Details */}
        <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3 mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-400">Category:</span>
            <span className="font-medium text-slate-200">{item.category}</span>
            {item.color && (
              <span className="ml-auto text-slate-400 font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                {item.color}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-400">Location:</span>
            <span className="font-medium text-slate-200 truncate">{item.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-400">Date:</span>
            <span className="font-medium text-slate-200">{formattedDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Link
            to={`/items/${item._id}`}
            className="flex-1 text-center py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
          >
            View Details
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          {item.type === 'found' && item.status === 'active' && onClaimClick && (
            <button
              onClick={() => onClaimClick(item)}
              className="py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Claim
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
