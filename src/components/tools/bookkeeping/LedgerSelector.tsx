import { useState } from 'react';
import { Book, Plus, X, Edit3, Trash2, Share2 } from 'lucide-react';
import type { Ledger } from '../../../lib/bookkeepingLedgers';
import { DEFAULT_LEDGER_ID } from '../../../lib/bookkeepingLedgers';

interface LedgerSelectorProps {
  t: (zh: string, en: string) => string;
  ledgers: Ledger[];
  selectedLedgerId: string;
  onSelect: (id: string) => void;
  onAdd: (name: string, emoji: string) => void;
  onEdit: (id: string, name: string, emoji: string) => void;
  onDelete: (id: string) => void;
  onShare?: (id: string) => void;
}

export default function LedgerSelector({
  t,
  ledgers,
  selectedLedgerId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onShare,
}: LedgerSelectorProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState('');

  const EMOJI_OPTIONS = ['📒', '💰', '🏠', '✈️', '🎓', '💼', '🎯', '❤️', '🎮', '🛒'];

  const handleSubmit = () => {
    if (!formName.trim()) return;
    if (editingId) {
      onEdit(editingId, formName, formEmoji);
      setEditingId(null);
    } else {
      onAdd(formName, formEmoji);
    }
    setFormName('');
    setFormEmoji('');
    setShowForm(false);
  };

  const startEdit = (ledger: Ledger) => {
    setEditingId(ledger.id);
    setFormName(ledger.name);
    setFormEmoji(ledger.emoji);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        t(
          '确定删除此账本？关联的记录不会被删除。',
          'Delete this ledger? Associated entries will not be deleted.',
        ),
      )
    ) {
      onDelete(id);
      if (selectedLedgerId === id) onSelect(DEFAULT_LEDGER_ID);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Book className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {t('账本', 'Ledgers')}
          </h3>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormName('');
              setFormEmoji('');
              setShowForm(true);
            }}
            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('新建', 'New')}
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFormEmoji(emoji)}
                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-colors ${
                  formEmoji === emoji
                    ? 'bg-indigo-100 dark:bg-indigo-950/50 ring-2 ring-indigo-500'
                    : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t('账本名称', 'Ledger name')}
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            <button
              onClick={handleSubmit}
              className="px-3 py-2 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors font-medium"
            >
              {editingId ? t('保存', 'Save') : t('创建', 'Create')}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          </div>
        </div>
      )}

      {/* Ledger list */}
      <div className="space-y-1">
        {/* Default ledger */}
        <button
          onClick={() => onSelect(DEFAULT_LEDGER_ID)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-left ${
            selectedLedgerId === DEFAULT_LEDGER_ID
              ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-semibold'
              : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          <span className="text-base">📒</span>
          <span className="flex-1">{t('默认账本', 'Default')}</span>
        </button>

        {/* Custom ledgers */}
        {ledgers.map((ledger) => (
          <div
            key={ledger.id}
            className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
              selectedLedgerId === ledger.id
                ? 'bg-indigo-50 dark:bg-indigo-950/30'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <button
              onClick={() => onSelect(ledger.id)}
              className="flex-1 flex items-center gap-2.5 text-left text-sm"
            >
              <span className="text-base">{ledger.emoji || '📋'}</span>
              <span
                className={`${
                  selectedLedgerId === ledger.id
                    ? 'text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {ledger.name}
              </span>
            </button>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {onShare && (
                <button
                  onClick={() => onShare(ledger.id)}
                  className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  title={t('分享', 'Share')}
                >
                  <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              )}
              <button
                onClick={() => startEdit(ledger)}
                className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                title={t('编辑', 'Edit')}
              >
                <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
              </button>
              <button
                onClick={() => handleDelete(ledger.id)}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                title={t('删除', 'Delete')}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
