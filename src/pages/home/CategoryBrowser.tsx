import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import {
  Gamepad2,
  Wrench,
  Zap,
  Timer,
  Code2,
  BookOpen,
  FileText,
  Shield,
  Sparkles,
  Brain,
  GraduationCap,
} from 'lucide-react';

type Translator = (zh: string, en: string) => string;

type CategoryBrowserProps = {
  t: Translator;
};

const toolCategories = [
  {
    label: '日常实用',
    labelEn: 'Daily Utility',
    icon: Zap,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  {
    label: '时间效率',
    labelEn: 'Time & Efficiency',
    icon: Timer,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  },
  {
    label: '开发辅助',
    labelEn: 'Developer Tools',
    icon: Code2,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  {
    label: '学习写作',
    labelEn: 'Study & Writing',
    icon: BookOpen,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  {
    label: '文档转换',
    labelEn: 'Document Conversion',
    icon: FileText,
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
  {
    label: '安全隐私',
    labelEn: 'Security & Privacy',
    icon: Shield,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  },
  {
    label: '趣味工具',
    labelEn: 'Fun Tools',
    icon: Sparkles,
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  },
];

const gameCategories = [
  {
    label: '反应挑战',
    labelEn: 'Action',
    icon: Zap,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  {
    label: '益智解谜',
    labelEn: 'Puzzle',
    icon: Brain,
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  },
  {
    label: '学习练习',
    labelEn: 'Educational',
    icon: GraduationCap,
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  },
];

export default function CategoryBrowser({ t }: CategoryBrowserProps) {
  const navigate = useNavigate();

  return (
    <section className="py-12 pb-20">
      <div
        className="mb-10"
      >
        <h2 className="font-nunito font-bold text-2xl text-on-surface mb-2">
          {t('分类入口', 'Browse by Category')}
        </h2>
        <p className="text-sm text-secondary">
          {t('快速找到你需要的工具或想玩的游戏', 'Quickly find the tool or game you need')}
        </p>
      </div>

      {/* Tool categories */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-on-surface-variant uppercase tracking-wide">
            {t('工具分类', 'Tool Categories')}
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {toolCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.label}
                onClick={() => {
                  const routeMap: Record<string, string> = {
                    日常实用: '/tools/daily',
                    时间效率: '/tools/time',
                    开发辅助: '/tools/dev',
                    学习写作: '/tools/study',
                    文档转换: '/tools/document',
                    安全隐私: '/tools/security',
                    趣味工具: '/tools/random',
                  };
                  navigate(routeMap[cat.label] ?? '/tools');
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-300 ${cat.color}`}
              >
                <Icon className="w-4 h-4" />
                {t(cat.label, cat.labelEn)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Game categories */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Gamepad2 className="w-4 h-4 text-tertiary" />
          <h3 className="font-semibold text-sm text-on-surface-variant uppercase tracking-wide">
            {t('游戏分类', 'Game Categories')}
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {gameCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.label}
                onClick={() => navigate(`/games?category=${encodeURIComponent(cat.label)}`)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-300 ${cat.color}`}
              >
                <Icon className="w-4 h-4" />
                {t(cat.label, cat.labelEn)}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
