'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, CheckCircle2, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, doc, setDoc, updateDoc, increment, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { PollDoc, PollVoteDoc } from '@/types/firestore';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function PollBanner() {
  const db = useFirestore();
  const { user } = useUser();
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);

  // Query for active poll
  const activePollQuery = useMemo(
    () => db && user ? query(collection(db, 'polls'), where('status', '==', 'active'), limit(1)) : null,
    [db, user]
  );
  const { data: activePolls = [], loading: pollLoading } = useCollection<PollDoc>(activePollQuery);
  const poll = activePolls[0] || null;

  // Check if current user already voted on this poll
  const userVoteQuery = useMemo(
    () => (db && user && poll)
      ? query(collection(db, 'pollVotes'), where('pollId', '==', poll.id), where('userId', '==', user.uid), limit(1))
      : null,
    [db, user, poll]
  );
  const { data: userVotes = [], loading: voteLoading } = useCollection<PollVoteDoc>(userVoteQuery);
  const hasVoted = userVotes.length > 0 || voted;

  const handleVote = async (optionIndex: number) => {
    if (!db || !user || !poll || hasVoted) return;
    setVoting(true);
    try {
      // Create vote doc
      const voteId = `${poll.id}_${user.uid}`;
      await setDoc(doc(db, 'pollVotes', voteId), {
        pollId: poll.id,
        userId: user.uid,
        optionIndex,
        createdAt: serverTimestamp(),
      });

      // Update aggregated counts on poll doc
      const pollRef = doc(db, 'polls', poll.id);
      const optionVotesUpdate: Record<string, unknown> = {
        totalVotes: increment(1),
      };
      // Use dot notation to increment specific array index
      optionVotesUpdate[`optionVotes.${optionIndex}`] = increment(1);

      // Firestore doesn't support incrementing array elements by index with dot notation
      // So we need to read current values and update
      const newOptionVotes = [...(poll.optionVotes || poll.options.map(() => 0))];
      newOptionVotes[optionIndex] = (newOptionVotes[optionIndex] || 0) + 1;
      await updateDoc(pollRef, {
        totalVotes: increment(1),
        optionVotes: newOptionVotes,
      });

      setVoted(true);
      toast({ title: '🗳️ Vote recorded!', description: 'Thanks for sharing your preference.' });
    } catch (err) {
      console.error('Vote error:', err);
      toast({ variant: 'destructive', title: 'Vote failed', description: 'Could not record your vote. Try again.' });
    } finally {
      setVoting(false);
    }
  };

  // Don't render if loading, no poll, or already voted
  if (pollLoading || voteLoading) return null;
  if (!poll || hasVoted) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4 }}
        className="mx-4 mb-4 bg-gradient-to-br from-purple-600/20 via-[#1a1a1a] to-[#FF6B35]/10 rounded-2xl border border-purple-500/20 overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 size={16} className="text-purple-400" />
            </div>
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Quick Poll</span>
          </div>
          <h3 className="text-white font-bold text-lg leading-snug">{poll.question}</h3>
        </div>

        {/* Options */}
        <div className="px-5 pb-5 space-y-2">
          {poll.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={voting}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-semibold",
                "bg-white/5 border-white/10 text-white hover:bg-purple-500/20 hover:border-purple-500/30",
                "active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {voting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  {option}
                </span>
              ) : (
                option
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
