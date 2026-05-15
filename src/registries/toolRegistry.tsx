import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const Calculator = lazy(() => import('../pages/tools/Calculator'));
const Pomodoro = lazy(() => import('../pages/tools/Pomodoro'));
const UnitConverter = lazy(() => import('../pages/tools/UnitConverter'));
const PasswordGenerator = lazy(() => import('../pages/tools/PasswordGenerator'));
const QRCodeGenerator = lazy(() => import('../pages/tools/QRCodeGenerator'));
const Compass = lazy(() => import('../pages/tools/Compass'));
const Scanner = lazy(() => import('../pages/tools/Scanner'));
const Weather = lazy(() => import('../pages/tools/Weather'));
const RandomPicker = lazy(() => import('../pages/tools/RandomPicker'));
const TimerStopwatch = lazy(() => import('../pages/tools/TimerStopwatch'));
const WordCounter = lazy(() => import('../pages/tools/WordCounter'));
const MarkdownPreview = lazy(() => import('../pages/tools/MarkdownPreview'));
const JsonFormatter = lazy(() => import('../pages/tools/JsonFormatter'));
const Base64Codec = lazy(() => import('../pages/tools/Base64Codec'));
const UrlCodec = lazy(() => import('../pages/tools/UrlCodec'));
const ColorConverter = lazy(() => import('../pages/tools/ColorConverter'));
const DateCalculator = lazy(() => import('../pages/tools/DateCalculator'));
const TextDiff = lazy(() => import('../pages/tools/TextDiff'));
const LoremGenerator = lazy(() => import('../pages/tools/LoremGenerator'));
const IPLookup = lazy(() => import('../pages/tools/IPLookup'));
const TipCalculator = lazy(() => import('../pages/tools/TipCalculator'));
const CaseConverter = lazy(() => import('../pages/tools/CaseConverter'));
const RandomNumber = lazy(() => import('../pages/tools/RandomNumber'));
const BMICalculator = lazy(() => import('../pages/tools/BMICalculator'));
const TextToSpeech = lazy(() => import('../pages/tools/TextToSpeech'));
const WordToPdf = lazy(() => import('../pages/tools/WordToPdf'));
const PdfToWord = lazy(() => import('../pages/tools/PdfToWord'));
const QuestionBankImporter = lazy(() => import('../pages/tools/QuestionBankImporter'));

export type ToolComponent = LazyExoticComponent<ComponentType<{ onBack: () => void }>>;

export const toolComponents: Record<string, ToolComponent> = {
  'tool-1': Calculator,
  'tool-2': Pomodoro,
  'tool-3': UnitConverter,
  'tool-4': PasswordGenerator,
  'tool-5': QRCodeGenerator,
  'tool-6': Compass,
  'tool-7': Scanner,
  'tool-8': Weather,
  'tool-9': RandomPicker,
  'tool-10': TimerStopwatch,
  'tool-11': WordCounter,
  'tool-12': MarkdownPreview,
  'tool-13': JsonFormatter,
  'tool-14': Base64Codec,
  'tool-15': UrlCodec,
  'tool-16': ColorConverter,
  'tool-17': DateCalculator,
  'tool-18': TextDiff,
  'tool-19': LoremGenerator,
  'tool-20': IPLookup,
  'tool-21': TipCalculator,
  'tool-22': CaseConverter,
  'tool-23': RandomNumber,
  'tool-24': BMICalculator,
  'tool-25': TextToSpeech,
  'tool-26': WordToPdf,
  'tool-27': PdfToWord,
  'tool-28': QuestionBankImporter,
};
