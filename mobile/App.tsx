import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  NativeModules,
  PermissionsAndroid,
  Pressable,
  RefreshControl,
  Share,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
  useWindowDimensions,
} from 'react-native'
import TextRecognition, {
  type TextLine,
} from '@react-native-ml-kit/text-recognition'
import {
  Camera,
  type CameraRef,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BRAND_THEME } from '../brand-theme'

type Kind =
  'dominical' | 'miercolito' | 'zodiaco' | 'extraordinario' | 'especial'
type Ticket = 'billete' | 'chance'
type Draw = {
  id: string
  kind: Kind
  title: string
  number: string
  date: string
  time: string
  first: string
  second: string
  third: string
  letters: string
  series: string
  folio: string
  billDigits: 4 | 5
  rulesVerified: boolean
  sourceUrl: string
  isDemo: boolean
  requiresLetters: boolean
  requiresSeriesFolio: boolean
}
type Match = { label: string; amountCents: number }
type CheckResult = {
  status: 'won' | 'no_win' | 'incomplete' | 'unavailable'
  matches: Match[]
  unknownPrizes: string[]
  totalCents: number
  missing: string[]
  verified: boolean
  isDemo: boolean
  number: string
  fractions: number
  drawTitle: string
  date: string
}

// Public API origin only. Supabase credentials stay on the server.
const API_BASE_URL = 'https://loteriapanamahoy.site'
const API_BASE = API_BASE_URL.replace(/\/$/, '')
const COLORS = {
  tone1: BRAND_THEME.tone1,
  tone2: BRAND_THEME.tone2,
  tone3: BRAND_THEME.tone3,
  tone4: BRAND_THEME.tone4,
  tone5: BRAND_THEME.tone5,
}
function withAlpha(color: string, alpha: number) {
  const hex = color.replace('#', '')
  const channels = [0, 2, 4].map((start) =>
    Number.parseInt(hex.slice(start, start + 2), 16),
  )
  return `rgba(${channels.join(',')},${alpha})`
}
const KIND_NAMES: Record<Kind, string> = {
  dominical: 'Dominical',
  miercolito: 'Miércolito',
  zodiaco: 'Gordito del Zodíaco',
  extraordinario: 'Extraordinario',
  especial: 'Especial',
}
const KIND_ICONS: Record<Kind, string> = {
  dominical: 'D',
  miercolito: 'M',
  zodiaco: 'Z',
  extraordinario: 'E',
  especial: 'S',
}
const KINDS = Object.keys(KIND_NAMES) as Kind[]
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const KIND_SHORT: Record<Kind, string> = {
  dominical: 'Dominical',
  miercolito: 'Miércolito',
  zodiaco: 'Zodíaco',
  extraordinario: 'Extraordinario',
  especial: 'Especial',
}

function money(cents: number) {
  return `B/. ${(cents / 100).toLocaleString('es-PA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function dateLabel(value: string, short = false) {
  const date = new Date(`${value}T12:00:00-05:00`)
  return new Intl.DateTimeFormat('es-PA', {
    day: 'numeric',
    month: short ? 'short' : 'long',
    year: 'numeric',
    timeZone: 'America/Panama',
  }).format(date)
}

function extractOcrCandidates(
  lines: TextLine[],
  digits: number,
) {
  const measuredLines = lines.flatMap((line) =>
    line.frame
      ? [{ line, frame: line.frame }]
      : [],
  )
  if (!measuredLines.length) return []

  // The large printed number sits in the central, lower half of both
  // Dominical and Miércolito tickets. Ignore barcode, folio and footer text.
  const maxRight = Math.max(
    ...measuredLines.map(({ frame }) => frame.left + frame.width),
  )
  const maxBottom = Math.max(
    ...measuredLines.map(({ frame }) => frame.top + frame.height),
  )
  const maxTextHeight = Math.max(...measuredLines.map(({ frame }) => frame.height))
  const ranked: { value: string; score: number }[] = []
  const numberOnly = (value: string) =>
    value
      .replace(/[OoQq]/g, '0')
      .replace(/[Il|]/g, '1')
      .replace(/[Ss]/g, '5')
      .replace(/[^\d]/g, '')

  for (const { line, frame } of measuredLines) {
    const centerX = (frame.left + frame.width / 2) / maxRight
    const centerY = (frame.top + frame.height / 2) / maxBottom
    if (centerX < 0.27 || centerX > 0.76 || centerY < 0.48 || centerY > 0.9)
      continue

    const xScore = 1 - Math.min(1, Math.abs(centerX - 0.51) / 0.3)
    const yScore = 1 - Math.min(1, Math.abs(centerY - 0.72) / 0.25)
    const sizeScore = frame.height / maxTextHeight
    const score = sizeScore * 2 + xScore + yScore
    const fullLine = numberOnly(line.text)
    if (fullLine.length === digits) ranked.push({ value: fullLine, score })

    for (const element of line.elements) {
      const value = numberOnly(element.text)
      if (value.length === digits) ranked.push({ value, score: score + 0.1 })
    }
  }

  // Some tickets are recognized as one glyph per OCR element. Rebuild only
  // aligned digit rows in the central number area; let the user confirm the pick.
  const glyphs = measuredLines.flatMap(({ line, frame }) =>
    line.elements.flatMap((element) => {
      if (!element.frame) return []
      const value = numberOnly(element.text)
      const centerX = (element.frame.left + element.frame.width / 2) / maxRight
      const centerY = (element.frame.top + element.frame.height / 2) / maxBottom
      if (
        value.length !== 1 ||
        centerX < 0.27 || centerX > 0.76 ||
        centerY < 0.48 || centerY > 0.9
      ) return []
      return [{
        value,
        x: centerX,
        y: centerY,
        height: element.frame.height,
        lineHeight: frame.height,
      }]
    }),
  )
  glyphs.sort((a, b) => a.y - b.y || a.x - b.x)
  for (let start = 0; start <= glyphs.length - digits; start += 1) {
    const row = glyphs.slice(start, start + digits)
    const sameRow = row.every((glyph) => Math.abs(glyph.y - row[0].y) < 0.025)
    const centered = row[0].x > 0.28 && row[row.length - 1].x < 0.75
    const compact = row.every(
      (glyph, index) =>
        index === 0 || glyph.x - row[index - 1].x < 0.075,
    )
    if (!sameRow || !centered || !compact) continue
    ranked.push({
      value: row.map((glyph) => glyph.value).join(''),
      score:
        row.reduce((sum, glyph) => sum + glyph.height, 0) / digits +
        row.reduce((sum, glyph) => sum + glyph.lineHeight, 0) / digits,
    })
  }

  const bestByValue = new Map<string, number>()
  for (const candidate of ranked) {
    const previous = bestByValue.get(candidate.value) ?? -Infinity
    bestByValue.set(candidate.value, Math.max(previous, candidate.score))
  }
  return [...bestByValue]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([value]) => value)
}

function SectionTitle({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string
  title: string
  right?: string
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.flex}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {!!right && <Text style={styles.sectionAside}>{right}</Text>}
    </View>
  )
}

function DrawNumbers({ draw, large = false }: { draw: Draw; large?: boolean }) {
  return (
    <View style={styles.numberStrip}>
      {[draw.first, draw.second, draw.third].map((number, index) => (
        <View
          key={`${draw.id}-${index}`}
          style={[styles.numberGroup, large && styles.numberGroupLarge]}
        >
          <Text style={styles.prizeCaption}>
            {index === 0 ? '1.er premio' : `${index + 1}.º premio`}
          </Text>
          <View style={[styles.numberBalls, large && styles.numberBallsLarge]}>
            {number.split('').map((digit, digitIndex) => (
              <View
                key={`${digitIndex}-${digit}`}
                style={[styles.ball, large && styles.ballLarge]}
              >
                <Text style={[styles.ballText, large && styles.ballTextLarge]}>
                  {digit}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}

function ResultSheet({
  result,
  onClose,
}: {
  result: CheckResult
  onClose: () => void
}) {
  const won = result.status === 'won'
  const incomplete =
    result.status === 'incomplete' || result.status === 'unavailable'
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Cerrar resultado"
        />
        <View style={styles.resultSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.resultStatus}>{won ? 'PREMIO' : result.status === 'no_win' ? 'CONSULTA' : 'REVISAR'}</Text>
          {result.isDemo && (
            <Text style={styles.demoLabel}>SIMULACIÓN · DATOS DE EJEMPLO</Text>
          )}
          <Text style={styles.resultTicket}>
            Tu {result.number.length === 2 ? 'chance' : 'billete'}{' '}
            {result.number}
          </Text>
          <Text style={styles.resultTitle}>
            {won
              ? result.verified
                ? '¡Tu número tiene premio!'
                : 'Hay una coincidencia'
              : result.status === 'no_win'
                ? 'Esta vez no hubo premio'
                : result.status === 'unavailable'
                  ? 'Resultado no disponible'
                  : 'Revisión incompleta'}
          </Text>
          <Text style={styles.resultBody}>
            {won
              ? 'Estas son las coincidencias encontradas en el sorteo.'
              : result.status === 'no_win'
                ? 'Tu número no coincide con los premios registrados.'
                : 'No podemos confirmar todas las reglas para este boleto todavía.'}
          </Text>
          {won && result.matches.length > 0 && (
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>PREMIO ORIENTATIVO</Text>
              <Text style={styles.amountValue}>{money(result.totalCents)}</Text>
              <Text style={styles.amountHint}>
                {result.fractions}{' '}
                {result.fractions === 1 ? 'fracción' : 'fracciones'}
              </Text>
            </View>
          )}
          {won &&
            result.matches.map((match, index) => (
              <View key={`${match.label}-${index}`} style={styles.matchRow}>
                <Text style={styles.matchLabel}>✓ {match.label}</Text>
                <Text style={styles.matchAmount}>
                  {money(match.amountCents)}
                </Text>
              </View>
            ))}
          {won &&
            result.unknownPrizes.map((label) => (
              <View key={label} style={styles.matchRow}>
                <Text style={styles.matchLabel}>✓ {label}</Text>
                <Text style={styles.matchAmount}>Monto por confirmar</Text>
              </View>
            ))}
          {incomplete && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {!result.verified
                  ? 'El plan de premios aún no está verificado. '
                  : ''}
                {result.missing.length
                  ? `Completa: ${result.missing.join(', ')}.`
                  : ''}
              </Text>
            </View>
          )}
          <Text style={styles.resultMeta}>
            {result.drawTitle} · {dateLabel(result.date)}
          </Text>
          <Text style={styles.disclaimer}>
            Consulta orientativa. Conserva tu boleto y confirma cualquier premio
            con la LNB.
          </Text>
          <Pressable onPress={onClose} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Comprobar otro número</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

export default function App() {
  const { width } = useWindowDimensions()
  const compact = width < 360
  const horizontalInset = width >= 720 ? 30 : compact ? 16 : 21
  const cameraRef = useRef<CameraRef>(null)
  const cameraDevice = useCameraDevice('back')
  const photoOutput = usePhotoOutput({ qualityPrioritization: 'quality' })
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraFailed, setCameraFailed] = useState(false)
  const [draws, setDraws] = useState<Draw[]>([])
  const [selectedDrawId, setSelectedDrawId] = useState('')
  const [activeKind, setActiveKind] = useState<Kind>('dominical')
  const [ticket, setTicket] = useState<Ticket>('billete')
  const [number, setNumber] = useState('')
  const [fractions, setFractions] = useState('1')
  const [letters, setLetters] = useState('')
  const [series, setSeries] = useState('')
  const [folio, setFolio] = useState('')
  const [screen, setScreen] = useState<'check' | 'results'>('check')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [showDrawPicker, setShowDrawPicker] = useState(false)
  const [resultsKind, setResultsKind] = useState<Kind | 'all'>('all')
  const [resultsQuery, setResultsQuery] = useState('')
  const [resultsYear, setResultsYear] = useState('')
  const [resultsMonth, setResultsMonth] = useState('')
  const [resultsDate, setResultsDate] = useState('')
  const [activeFilterPicker, setActiveFilterPicker] = useState<'year' | 'month' | 'date' | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [showExtras, setShowExtras] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [scanMessage, setScanMessage] = useState('')
  const [ocrCandidates, setOcrCandidates] = useState<string[]>([])
  const [readingOcr, setReadingOcr] = useState(false)
  const { hasPermission: cameraPermission, requestPermission: requestCameraPermission } = useCameraPermission()

  const loadDraws = useCallback(
    async (refresh = false) => {
      if (!API_BASE) {
        setError(
          'No detectamos el servidor web. Revisa API_BASE_URL en App.tsx o inicia la web en el puerto 3015.'
        )
        setLoading(false)
        setRefreshing(false)
        return
      }
      if (refresh) setRefreshing(true)
      else setLoading(true)
      setError('')
      try {
        const response = await fetch(`${API_BASE}/api/draws`, {
          headers: { Accept: 'application/json' },
        })
        const data = await response.json()
        if (!response.ok)
          throw new Error(data.error || 'No se pudieron cargar los resultados.')
        if (!Array.isArray(data))
          throw new Error('La respuesta de resultados no es válida.')
        const sorted = (data as Draw[]).sort((a, b) =>
          `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)
        )
        setDraws(sorted)
        if (sorted.length) {
          const current = sorted.find((draw) => draw.id === selectedDrawId)
          const initial = current || sorted[0]
          setSelectedDrawId(initial.id)
          setActiveKind(initial.kind)
        }
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'No se pudo conectar. Comprueba tu conexión.'
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [selectedDrawId]
  )

  useEffect(() => {
    void loadDraws()
  }, [loadDraws])

  const selectedDraw = draws.find((draw) => draw.id === selectedDrawId)
  const drawsOfKind = useMemo(
    () => draws.filter((draw) => draw.kind === activeKind),
    [draws, activeKind]
  )
  const resultsYears = useMemo(
    () => [...new Set(draws.map((draw) => draw.date.slice(0, 4)))].sort().reverse(),
    [draws],
  )
  const resultsMonths = useMemo(
    () => [...new Set(draws.filter((draw) => !resultsYear || draw.date.startsWith(`${resultsYear}-`)).map((draw) => draw.date.slice(5, 7)))].sort(),
    [draws, resultsYear],
  )
  const resultsDates = useMemo(
    () => [...new Set(draws.filter((draw) => (!resultsYear || draw.date.startsWith(`${resultsYear}-`)) && (!resultsMonth || draw.date.slice(5, 7) === resultsMonth)).map((draw) => draw.date))].sort().reverse(),
    [draws, resultsYear, resultsMonth],
  )
  const filteredDraws = useMemo(() => {
    const query = resultsQuery.trim().toLowerCase()
    return draws.filter((draw) => {
      const matchesQuery = !query || [draw.number, draw.first, draw.second, draw.third, draw.title, KIND_NAMES[draw.kind]].some((value) => value.toLowerCase().includes(query))
      return (resultsKind === 'all' || draw.kind === resultsKind)
        && (!resultsYear || draw.date.startsWith(`${resultsYear}-`))
        && (!resultsMonth || draw.date.slice(5, 7) === resultsMonth)
        && (!resultsDate || draw.date === resultsDate)
        && matchesQuery
    })
  }, [draws, resultsKind, resultsYear, resultsMonth, resultsDate, resultsQuery])
  const filterOptions = activeFilterPicker === 'year'
    ? resultsYears.map((value) => ({ value, label: value }))
    : activeFilterPicker === 'month'
      ? resultsMonths.map((value) => ({ value, label: MONTH_NAMES[Number(value) - 1] }))
      : resultsDates.map((value) => ({ value, label: dateLabel(value) }))

  async function enableNotifications() {
    if (Platform.OS !== 'android' || !NativeModules.DrawAlerts) {
      setNotificationMessage('Los avisos en segundo plano están disponibles en Android.')
      return
    }
    try {
      if (Number(Platform.Version) >= 33) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setNotificationMessage('Permite las notificaciones de Lotería Panamá en Android para recibir avisos.')
          return
        }
      }
      await NativeModules.DrawAlerts.schedule(draws.map((draw) => draw.id))
      setNotificationsEnabled(true)
      setNotificationMessage('Android revisará resultados nuevos con conexión; el aviso puede tardar unos minutos.')
    } catch {
      setNotificationMessage('No pudimos activar los avisos. Inténtalo de nuevo.')
    }
  }

  async function shareDraw(draw: Draw) {
    const message = [
      `${draw.title || KIND_NAMES[draw.kind]} · Sorteo N.º ${draw.number}`,
      `Fecha: ${dateLabel(draw.date)}`,
      `Primer premio: ${draw.first} · Segundo: ${draw.second} · Tercero: ${draw.third}`,
      `${API_BASE}/resultados/${draw.id}`,
    ].join('\n')
    await Share.share({ message, title: 'Resultados de Lotería Panamá' })
  }
  const digits = ticket === 'chance' ? 2 : selectedDraw?.billDigits || 4
  const scanDigits = selectedDraw?.billDigits || 4

  function changeKind(kind: Kind) {
    setActiveKind(kind)
    const first = draws.find((draw) => draw.kind === kind)
    if (first) setSelectedDrawId(first.id)
    setResult(null)
    setFormError('')
  }

  function chooseDraw(draw: Draw) {
    setSelectedDrawId(draw.id)
    setActiveKind(draw.kind)
    setNumber('')
    setResult(null)
    setFormError('')
    setShowDrawPicker(false)
  }

  async function checkTicket() {
    Keyboard.dismiss()
    setFormError('')
    if (!selectedDraw) {
      setFormError('Todavía no hay un sorteo publicado para consultar.')
      return
    }
    if (!new RegExp(`^\\d{${digits}}$`).test(number)) {
      setFormError(
        `Escribe las ${digits} cifras completas, incluyendo los ceros iniciales.`
      )
      return
    }
    const fractionCount = Number(fractions)
    if (
      !Number.isInteger(fractionCount) ||
      fractionCount < 1 ||
      fractionCount > 10000
    ) {
      setFormError('La cantidad de fracciones debe ser de 1 a 10,000.')
      return
    }
    if (!API_BASE) {
      setFormError('No detectamos el servidor web. Revisa API_BASE_URL en App.tsx.')
      return
    }
    setChecking(true)
    try {
      const response = await fetch(`${API_BASE}/api/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          drawId: selectedDraw.id,
          ticket,
          number,
          fractions: fractionCount,
          letters: letters.toUpperCase(),
          series,
          folio,
        }),
      })
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || 'No se pudo comprobar el número.')
      setResult(data as CheckResult)
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo conectar. Inténtalo de nuevo.'
      )
    } finally {
      setChecking(false)
    }
  }

  async function openScanner() {
    setScanMessage('')
    setOcrCandidates([])
    setCameraReady(false)
    setCameraFailed(false)
    if (!cameraPermission) {
      const granted = await requestCameraPermission()
      if (!granted) {
        setFormError(
          'Para escanear, permite el acceso a la cámara. También puedes escribir el número.'
        )
        return
      }
    }
    if (!cameraDevice) {
      setCameraFailed(true)
      setScanMessage('No encontramos una cámara trasera disponible en este dispositivo.')
    }
    setShowCamera(true)
  }

  async function captureAndReadTicket() {
    if (!cameraRef.current || !cameraReady || readingOcr) return
    setReadingOcr(true)
    setScanMessage('Leyendo las cifras impresas…')
    setOcrCandidates([])
    try {
      const photo = await photoOutput.capturePhotoToFile({ flashMode: 'off' }, {})
      const imageUri = photo.filePath.startsWith('file://')
        ? photo.filePath
        : `file://${photo.filePath}`
      const recognized = await TextRecognition.recognize(imageUri)
      const billetCandidates = extractOcrCandidates(
        recognized.blocks.flatMap((block) => block.lines),
        scanDigits,
      )
      const candidates = ticket === 'chance'
        ? [...new Set(billetCandidates.map((candidate) => candidate.slice(-2)))]
        : billetCandidates
      setOcrCandidates(candidates)
      setScanMessage(
        candidates.length
          ? 'Estas cifras salieron de la zona central del billete. Elige la correcta y revísala antes de comprobar.'
          : `No distinguimos las ${scanDigits} cifras grandes. Alinea esa fila en el marco, acerca un poco el billete y vuelve a tomar la foto.`,
      )
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : ''
      setScanMessage(
        /camera is not ready|not ready/i.test(detail)
            ? 'La cámara todavía se está preparando. Espera un momento y vuelve a intentar.'
          : detail || 'No pudimos leer el boleto. Inténtalo de nuevo.',
      )
    } finally {
      setReadingOcr(false)
    }
  }

  function chooseOcrNumber(value: string) {
    setNumber(value)
    setShowCamera(false)
    setScanMessage('Número leído. Revísalo y pulsa comprobar.')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.tone1} />
      <View style={[styles.topBar, { paddingHorizontal: horizontalInset }]}>
        <Image source={require('./assets/icon-lph-192.png')} style={styles.brandMark} accessibilityLabel="Logo de Lotería Panamá Hoy" />
        <View style={styles.brandCopy}>
          <Text style={styles.brandName}>Lotería Panamá</Text>
          <Text style={styles.brandTagline}>RESULTADOS DE SORTEOS</Text>
        </View>
        <View style={styles.freePill}>
          <Text style={styles.freePillText}>PA · PANAMÁ</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalInset }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDraws(true)}
            tintColor={COLORS.tone5}
          />
        }
      >
        <View style={styles.welcomeRow}>
          <View style={styles.welcomeCopy}>
            <Text style={styles.eyebrow}>LOTERÍA NACIONAL · PANAMÁ</Text>
            <Text style={[styles.welcomeTitle, compact && styles.welcomeTitleCompact]}>
              Consulta los resultados
            </Text>
            <Text style={styles.welcomeBody}>
              Revisa tu billete de Dominical o Miércolito en segundos.
            </Text>
          </View>
          <View style={styles.panamaBadge}>
            <Text style={styles.panamaBadgeFlag}>PA</Text>
            <Text style={styles.panamaBadgeText}>LOTERÍA</Text>
            <Text style={styles.panamaBadgeText}>PANAMÁ</Text>
          </View>
        </View>

        <View style={styles.trustRow}>
          <Text style={styles.trustText}>Dominical</Text>
          <Text style={styles.trustDivider}>·</Text>
          <Text style={styles.trustText}>Miércolito</Text>
          <Text style={styles.trustDivider}>·</Text>
          <Text style={styles.trustText}>Consulta gratis</Text>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              No pudimos cargar los resultados
            </Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Pressable
              onPress={() => loadDraws(true)}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Intentar de nuevo</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={COLORS.tone5} />
            <Text style={styles.loadingText}>
              Buscando resultados publicados…
            </Text>
          </View>
        ) : (
          <>
            {screen === 'check' ? (
              <View style={styles.checkCard}>
                <View style={styles.cardHeading}>
                  <View style={styles.cardHeadingIcon}><Text style={styles.cardHeadingIconText}>LPH</Text></View>
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>Revisa tu billete</Text>
                    <Text style={styles.cardSubtitle}>
                      Elige el sorteo y escribe tus cifras.
                    </Text>
                  </View>
                  <Text style={styles.secureMark}>LPH</Text>
                </View>

                <View style={styles.ticketToggle}>
                  {(['billete', 'chance'] as Ticket[]).map((option) => (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setTicket(option)
                        setNumber('')
                        setResult(null)
                        setFormError('')
                      }}
                      style={[
                        styles.ticketOption,
                        ticket === option && styles.ticketOptionSelected,
                      ]}
                    >
                      <Text style={styles.ticketIcon}>
                        {option === 'billete' ? 'B' : 'C'}
                      </Text>
                      <View>
                        <Text
                          style={[
                            styles.ticketTitle,
                            ticket === option && styles.ticketTitleSelected,
                          ]}
                        >
                          {option === 'billete' ? 'Billete' : 'Chance'}
                        </Text>
                        <Text style={[styles.ticketSub, ticket === option && styles.ticketSubSelected]}>
                          {option === 'billete'
                            ? `${selectedDraw?.billDigits || 4} cifras`
                            : '2 cifras'}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.inputLabel}>SORTEO</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.kindScroll}
                >
                  {KINDS.map((kind) => (
                    <Pressable
                      key={kind}
                      onPress={() => changeKind(kind)}
                      style={[
                        styles.kindChip,
                        activeKind === kind && styles.kindChipActive,
                      ]}
                    >
                      <Text>{KIND_ICONS[kind]}</Text>
                      <Text
                        style={[
                          styles.kindChipText,
                          activeKind === kind && styles.kindChipTextActive,
                        ]}
                      >
                        {KIND_NAMES[kind]}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>RESULTADO PUBLICADO</Text>
                {drawsOfKind.length ? (
                  <Pressable
                    onPress={() => setShowDrawPicker(true)}
                    style={styles.drawSelect}
                  >
                    <View style={styles.drawSelectIcon}>
                      <Text>{KIND_ICONS[activeKind]}</Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.drawSelectTitle}>
                        {selectedDraw?.title || KIND_NAMES[activeKind]}
                      </Text>
                      <Text style={styles.drawSelectSubtitle}>
                        Sorteo N.º {selectedDraw?.number} ·{' '}
                        {selectedDraw ? dateLabel(selectedDraw.date, true) : ''}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>⌄</Text>
                  </Pressable>
                ) : (
                  <View style={styles.emptyInline}>
                    <Text style={styles.emptyInlineText}>
                      Aún no hay resultados publicados para{' '}
                      {KIND_NAMES[activeKind]}.
                    </Text>
                  </View>
                )}

                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>
                    NÚMERO DE TU {ticket.toUpperCase()}
                  </Text>
                  <Text style={styles.digitHint}>{digits} CIFRAS</Text>
                </View>
                <View style={styles.numberInputWrap}>
                  <TextInput
                    value={number}
                    onChangeText={(value) => {
                      setNumber(value.replace(/\D/g, '').slice(0, digits))
                      setFormError('')
                    }}
                    keyboardType="number-pad"
                    maxLength={digits}
                    placeholder={'0'.repeat(digits)}
                    placeholderTextColor={COLORS.tone4}
                    style={styles.numberInput}
                    accessibilityLabel={`Número de ${ticket}, ${digits} cifras`}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>
                <View style={styles.numberHelpRow}>
                  <Text style={styles.helperText}>
                    Incluye los ceros al inicio.
                  </Text>
                  <Pressable
                    onPress={() => void openScanner()}
                    style={styles.scanButton}
                  >
                    <Text style={styles.scanIcon}>LEER</Text>
                    <Text style={styles.scanButtonText}>Escanear</Text>
                  </Pressable>
                </View>
                {scanMessage ? (
                  <Text style={styles.scanMessage}>{scanMessage}</Text>
                ) : null}

                <View style={styles.fractionRow}>
                  <Text style={styles.inputLabel}>FRACCIONES</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() =>
                        setFractions(
                          String(Math.max(1, Number(fractions || 1) - 1))
                        )
                      }
                      style={styles.stepperButton}
                    >
                      <Text style={styles.stepperText}>−</Text>
                    </Pressable>
                    <TextInput
                      value={fractions}
                      onChangeText={(v) =>
                        setFractions(v.replace(/\D/g, '').slice(0, 5))
                      }
                      keyboardType="number-pad"
                      style={styles.fractionInput}
                      accessibilityLabel="Cantidad de fracciones"
                    />
                    <Pressable
                      onPress={() =>
                        setFractions(
                          String(Math.min(10000, Number(fractions || 0) + 1))
                        )
                      }
                      style={styles.stepperButton}
                    >
                      <Text style={styles.stepperText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                {(selectedDraw?.requiresLetters ||
                  selectedDraw?.requiresSeriesFolio) && (
                  <Pressable
                    onPress={() => setShowExtras(!showExtras)}
                    style={styles.extrasToggle}
                  >
                    <Text style={styles.extrasToggleText}>
                      Serie, folio y letras
                    </Text>
                    <Text style={styles.extrasChevron}>
                      {showExtras ? '⌃' : '⌄'}
                    </Text>
                  </Pressable>
                )}
                {showExtras &&
                  selectedDraw?.requiresLetters &&
                  ticket === 'billete' && (
                    <View style={styles.extraField}>
                      <Text style={styles.inputLabel}>LETRAS DEL BILLETE</Text>
                      <TextInput
                        value={letters}
                        onChangeText={(v) =>
                          setLetters(
                            v
                              .toUpperCase()
                              .replace(/[^A-D]/g, '')
                              .slice(0, 4)
                          )
                        }
                        autoCapitalize="characters"
                        maxLength={4}
                        placeholder="ABCD"
                        style={styles.extraInput}
                      />
                    </View>
                  )}
                {showExtras &&
                  selectedDraw?.requiresSeriesFolio &&
                  ticket === 'billete' && (
                    <View style={styles.extraFieldsRow}>
                      <View style={styles.flex}>
                        <Text style={styles.inputLabel}>SERIE</Text>
                        <TextInput
                          value={series}
                          onChangeText={(v) =>
                            setSeries(v.replace(/\D/g, '').slice(0, 3))
                          }
                          keyboardType="number-pad"
                          placeholder="000"
                          style={styles.extraInput}
                        />
                      </View>
                      <View style={styles.flex}>
                        <Text style={styles.inputLabel}>FOLIO</Text>
                        <TextInput
                          value={folio}
                          onChangeText={(v) =>
                            setFolio(v.replace(/\D/g, '').slice(0, 3))
                          }
                          keyboardType="number-pad"
                          placeholder="000"
                          style={styles.extraInput}
                        />
                      </View>
                    </View>
                  )}

                {formError ? (
                  <View style={styles.formError}>
                    <Text style={styles.formErrorText}>{formError}</Text>
                  </View>
                ) : null}
                <Pressable
                  onPress={() => void checkTicket()}
                  disabled={checking || !draws.length}
                  style={[
                    styles.primaryButton,
                    (checking || !draws.length) && styles.buttonDisabled,
                  ]}
                >
                  {checking ? (
                    <ActivityIndicator color={COLORS.tone1} />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Comprobar mi número →
                    </Text>
                  )}
                </Pressable>
                <View style={styles.privacyNote}>
                  <Text style={styles.privacyCheck}>✓</Text>
                  <Text style={styles.privacyText}>
                    Tu número se revisa y no se guarda.
                  </Text>
                </View>
                {result && (
                  <ResultSheet
                    result={result}
                    onClose={() => setResult(null)}
                  />
                )}
              </View>
            ) : (
              <View style={styles.resultsView}>
                <SectionTitle
                  eyebrow="SORTEOS PUBLICADOS"
                  title="Resultados recientes"
                  right={`${filteredDraws.length} ${filteredDraws.length === 1 ? 'sorteo' : 'sorteos'}`}
                />
                <TextInput
                  value={resultsQuery}
                  onChangeText={setResultsQuery}
                  placeholder="Buscar número o sorteo"
                  placeholderTextColor={COLORS.tone4}
                  style={styles.historySearch}
                  accessibilityLabel="Buscar por número o sorteo"
                  returnKeyType="search"
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyKinds}>
                  <Pressable onPress={() => setResultsKind('all')} style={[styles.historyKind, resultsKind === 'all' && styles.historyKindSelected]}><Text style={[styles.historyKindText, resultsKind === 'all' && styles.historyKindTextSelected]}>Todos</Text></Pressable>
                  {KINDS.map((kind) => <Pressable key={kind} onPress={() => setResultsKind(kind)} style={[styles.historyKind, resultsKind === kind && styles.historyKindSelected]}><Text style={[styles.historyKindText, resultsKind === kind && styles.historyKindTextSelected]}>{KIND_SHORT[kind]}</Text></Pressable>)}
                </ScrollView>
                <View style={styles.historyDateFilters}>
                  {([
                    ['year', resultsYear || 'Año'],
                    ['month', resultsMonth ? MONTH_NAMES[Number(resultsMonth) - 1] : 'Mes'],
                    ['date', resultsDate ? dateLabel(resultsDate, true) : 'Día'],
                  ] as const).map(([filter, label]) => (
                    <Pressable key={filter} disabled={filter === 'month' ? !resultsYear : filter === 'date' ? !resultsYear || !resultsMonth : false} onPress={() => setActiveFilterPicker(filter)} style={[styles.historyDateButton, ((filter === 'month' && !resultsYear) || (filter === 'date' && (!resultsYear || !resultsMonth))) && styles.historyDateButtonDisabled]}>
                      <Text style={styles.historyDateText}>{label}  ▾</Text>
                    </Pressable>
                  ))}
                  {(resultsYear || resultsMonth || resultsDate || resultsQuery || resultsKind !== 'all') && <Pressable onPress={() => { setResultsYear(''); setResultsMonth(''); setResultsDate(''); setResultsQuery(''); setResultsKind('all') }} style={styles.clearFilters}><Text style={styles.clearFiltersText}>Limpiar</Text></Pressable>}
                </View>
                <Pressable onPress={() => void enableNotifications()} style={styles.alertsButton} accessibilityRole="button" accessibilityLabel="Activar avisos de resultados nuevos">
                  <Text style={styles.alertsButtonText}>{notificationsEnabled ? 'Avisos activados' : 'Activar avisos de resultados nuevos'}</Text>
                </Pressable>
                {notificationMessage ? <Text style={styles.alertsHelp}>{notificationMessage}</Text> : <Text style={styles.alertsHelp}>Android puede tardar hasta 15 minutos entre revisiones.</Text>}
                {!draws.length ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Aún no hay resultados</Text>
                    <Text style={styles.emptyBody}>
                      Cuando se publiquen sorteos, aparecerán aquí.
                    </Text>
                  </View>
                ) : filteredDraws.length === 0 ? (
                  <View style={styles.emptyCard}><Text style={styles.emptyTitle}>No encontramos resultados</Text><Text style={styles.emptyBody}>Prueba con otros filtros o borra la búsqueda.</Text></View>
                ) : (
                  filteredDraws.map((draw) => (
                    <View
                      key={draw.id}
                      style={styles.resultCard}
                    >
                      <View style={styles.resultTicketTop}>
                        <View style={styles.resultDateBadge}>
                          <Text style={styles.resultDateMonth}>
                            {dateLabel(draw.date, true).split(' ')[1]?.replace('.', '').toUpperCase()}
                          </Text>
                          <Text style={styles.resultDateDay}>
                            {new Date(`${draw.date}T12:00:00-05:00`).getDate()}
                          </Text>
                        </View>
                        <View style={styles.flex}>
                          <Text style={styles.resultCardKind}>
                            {draw.title || KIND_NAMES[draw.kind]}
                          </Text>
                          <Text style={styles.resultCardDate}>
                            {KIND_NAMES[draw.kind]} · Sorteo N.º {draw.number}
                          </Text>
                        </View>
                        <View style={styles.recentPill}>
                          <View style={styles.recentDot} />
                          <Text style={styles.recentText}>PUBLICADO</Text>
                        </View>
                      </View>
                      <View style={styles.ticketPerforation} />
                      <View style={styles.firstPrizePanel}>
                        <Text style={styles.firstPrizeEyebrow}>PRIMER PREMIO</Text>
                        <Text style={[styles.firstPrizeNumber, compact && styles.firstPrizeNumberCompact]}>
                          {draw.first.split('').join('')}
                        </Text>
                        <Text style={styles.firstPrizeCaption}>
                          BILLETE GANADOR · {draw.billDigits} CIFRAS
                        </Text>
                      </View>
                      <View style={styles.secondaryPrizeRow}>
                        {[draw.second, draw.third].map((winningNumber, index) => (
                          <View key={`${draw.id}-prize-${index}`} style={styles.secondaryPrize}>
                            <Text style={styles.secondaryPrizeLabel}>
                              {index === 0 ? 'SEGUNDO PREMIO' : 'TERCER PREMIO'}
                            </Text>
                            <Text style={styles.secondaryPrizeNumber}>
                              {winningNumber}
                            </Text>
                          </View>
                        ))}
                      </View>
                      {draw.kind === 'zodiaco' && (
                        <Text style={styles.zodiacLine}>
                          Gordito del Zodíaco · {draw.billDigits} cifras
                        </Text>
                      )}
                      {!draw.rulesVerified && (
                        <Text style={styles.pendingRules}>
                          Plan de premios por confirmar
                        </Text>
                      )}
                      {draw.sourceUrl ? (
                        <Text style={styles.sourceLine}>
                          Fuente oficial registrada ↗
                        </Text>
                      ) : null}
                      <View style={styles.resultTicketAction}>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Comprobar sorteo ${draw.number}`} onPress={() => { chooseDraw(draw); setScreen('check') }} style={styles.resultActionButton}>
                          <Text style={styles.resultTicketActionText}>Comprobar</Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Compartir sorteo ${draw.number}`} onPress={() => void shareDraw(draw)} style={styles.resultActionButton}>
                          <Text style={styles.resultTicketActionText}>Compartir</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {screen === 'check' && draws.length > 0 && (
              <View style={styles.latestSection}>
                <SectionTitle
                  eyebrow="NÚMEROS GANADORES"
                  title="Último resultado"
                />
                <Pressable
                  onPress={() => setScreen('results')}
                  style={styles.latestCard}
                >
                  <View style={styles.latestTop}>
                    <View style={styles.latestIcon}>
                      <Text style={styles.kindInitial}>{KIND_ICONS[draws[0].kind]}</Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.latestName}>
                        {draws[0].title || KIND_NAMES[draws[0].kind]}
                      </Text>
                      <Text style={styles.latestDate}>
                        Sorteo N.º {draws[0].number} ·{' '}
                        {dateLabel(draws[0].date, true)}
                      </Text>
                    </View>
                    <Text style={styles.latestArrow}>↗</Text>
                  </View>
                  <DrawNumbers draw={draws[0]} large />
                  <Text style={styles.viewAll}>Ver todos los resultados →</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.footerNote}>
              <Text style={styles.footerShield}>◈</Text>
              <Text style={styles.footerText}>
                Información orientativa · Confirma tus premios con la LNB.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomNav, { paddingHorizontal: horizontalInset }]}>
        <Pressable onPress={() => setScreen('check')} style={styles.navItem}>
          <Text
            style={[styles.navIcon, screen === 'check' && styles.navIconActive]}
          >
            C
          </Text>
          <Text
            style={[styles.navText, screen === 'check' && styles.navTextActive]}
          >
            Comprobar
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setScreen('results')
            void loadDraws(true)
          }}
          style={styles.navItem}
        >
          <Text
            style={[
              styles.navIcon,
              screen === 'results' && styles.navIconActive,
            ]}
          >
            R
          </Text>
          <Text
            style={[
              styles.navText,
              screen === 'results' && styles.navTextActive,
            ]}
          >
            Resultados
          </Text>
        </Pressable>
      </View>

      <Modal
        transparent
        animationType="slide"
        visible={!!activeFilterPicker}
        onRequestClose={() => setActiveFilterPicker(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setActiveFilterPicker(null)} />
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.pickerTitle}>{activeFilterPicker === 'year' ? 'Elige un año' : activeFilterPicker === 'month' ? 'Elige un mes' : 'Elige un día'}</Text>
            <ScrollView style={styles.pickerList}>
              {filterOptions.map((option) => (
                <Pressable key={option.value} onPress={() => {
                  if (activeFilterPicker === 'year') { setResultsYear(option.value); setResultsMonth(''); setResultsDate('') }
                  if (activeFilterPicker === 'month') { setResultsMonth(option.value); setResultsDate('') }
                  if (activeFilterPicker === 'date') setResultsDate(option.value)
                  setActiveFilterPicker(null)
                }} style={styles.pickerOption}>
                  <Text style={styles.pickerOptionTitle}>{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => { if (activeFilterPicker === 'year') { setResultsYear(''); setResultsMonth(''); setResultsDate('') }; if (activeFilterPicker === 'month') { setResultsMonth(''); setResultsDate('') }; if (activeFilterPicker === 'date') setResultsDate(''); setActiveFilterPicker(null) }} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Todos</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="slide"
        visible={showDrawPicker}
        onRequestClose={() => setShowDrawPicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowDrawPicker(false)}
          />
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.pickerTitle}>Elige un resultado</Text>
            <Text style={styles.pickerSubtitle}>
              Solo mostramos sorteos publicados.
            </Text>
            <ScrollView style={styles.pickerList}>
              {drawsOfKind.map((draw) => (
                <Pressable
                  key={draw.id}
                  onPress={() => chooseDraw(draw)}
                  style={[
                    styles.pickerOption,
                    draw.id === selectedDrawId && styles.pickerOptionSelected,
                  ]}
                >
                  <View style={styles.drawKindIcon}>
                    <Text>{KIND_ICONS[draw.kind]}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.pickerOptionTitle}>
                      {draw.title || KIND_NAMES[draw.kind]}
                    </Text>
                    <Text style={styles.pickerOptionDate}>
                      Sorteo N.º {draw.number} · {dateLabel(draw.date, true)}
                    </Text>
                  </View>
                  {draw.id === selectedDrawId && (
                    <Text style={styles.selectedCheck}>✓</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => setShowDrawPicker(false)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Listo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={showCamera}
        onRequestClose={() => setShowCamera(false)}
      >
        <SafeAreaView style={styles.cameraModal} edges={['top', 'bottom']}>
          <View style={styles.cameraHeader}>
            <Pressable
              onPress={() => setShowCamera(false)}
              style={styles.cameraClose}
            >
              <Text style={styles.cameraCloseText}>×</Text>
            </Pressable>
            <Text style={styles.cameraTitle}>Lee tu boleto</Text>
            <View style={styles.cameraCloseSpacer} />
          </View>
          <View style={styles.cameraFrame}>
            {cameraDevice ? (
              <Camera
                ref={cameraRef}
                style={styles.camera}
                device={cameraDevice}
                isActive={showCamera}
                outputs={[photoOutput]}
                enableNativeTapToFocusGesture
                enableNativeZoomGesture
                onPreviewStarted={() => {
                  setCameraReady(true)
                  setCameraFailed(false)
                }}
                onError={(event) => {
                  setCameraReady(false)
                  setCameraFailed(true)
                  setScanMessage(`No se pudo iniciar la cámara: ${event.message}`)
                }}
              />
            ) : (
              <View style={styles.cameraUnavailable}>
                <Text style={styles.cameraInstruction}>{scanMessage}</Text>
              </View>
            )}
            <View pointerEvents="none" style={styles.scanGuide}>
              <View style={styles.scanFrame}>
                <View style={styles.scanCornerTL} />
                <View style={styles.scanCornerTR} />
                <View style={styles.scanCornerBL} />
                <View style={styles.scanCornerBR} />
                <Text style={styles.scanGuideText}>
                  {ticket === 'chance' ? `${scanDigits} → 2 CIFRAS` : `${scanDigits} CIFRAS`}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.cameraInstruction}>
            {scanMessage ||
              `Alinea el número grande de ${scanDigits} cifras dentro del marco. Evita el QR, el folio y los reflejos.`}
          </Text>
          {ocrCandidates.length > 0 && (
            <View style={styles.ocrCandidates}>
              {ocrCandidates.map((candidate) => (
                <Pressable key={candidate} onPress={() => chooseOcrNumber(candidate)} style={styles.ocrCandidate}>
                  <Text style={styles.ocrCandidateText}>{candidate}</Text>
                  <Text style={styles.ocrCandidateHint}>Usar este número</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Pressable
            onPress={() => cameraFailed ? setShowCamera(false) : void captureAndReadTicket()}
            disabled={readingOcr || (!cameraReady && !cameraFailed)}
            style={[styles.primaryButton, (readingOcr || (!cameraReady && !cameraFailed)) && styles.buttonDisabled]}
          >
            {readingOcr || (!cameraReady && !cameraFailed)
              ? <ActivityIndicator color={COLORS.tone1} />
              : <Text style={styles.primaryButtonText}>{cameraFailed ? 'Volver al número' : ocrCandidates.length ? 'Volver a tomar foto' : 'Leer cifras del boleto'}</Text>}
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.tone1 },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingBottom: 36 },
  topBar: {
    height: 70,
    paddingHorizontal: 20,
    backgroundColor: COLORS.tone1,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0,
  },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    marginRight: 10,
  },
  flagTopRow: { flex: 1, flexDirection: 'row' },
  flagBottomRow: { flex: 1, flexDirection: 'row' },
  flagCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flagRed: { backgroundColor: COLORS.tone5 },
  flagBlue: { backgroundColor: COLORS.tone5 },
  flagStarBlue: { color: COLORS.tone5, fontSize: 13 },
  flagStarRed: { color: COLORS.tone5, fontSize: 13 },
  brandCopy: { flex: 1 },
  brandName: {
    color: COLORS.tone5,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.25,
    includeFontPadding: false,
  },
  brandTagline: {
    color: COLORS.tone4,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.05,
    marginTop: 1,
  },
  freePill: {
    backgroundColor: COLORS.tone1,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.tone2,
  },
  freePillText: {
    color: COLORS.tone5,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tone2,
    borderRadius: 23,
    paddingVertical: 20,
    paddingHorizontal: 19,
    marginTop: 9,
    marginBottom: 14,
    minHeight: 155,
  },
  welcomeCopy: { flex: 1, paddingRight: 11 },
  eyebrow: {
    color: COLORS.tone5,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  welcomeTitle: {
    color: COLORS.tone5,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
    letterSpacing: -1,
  },
  welcomeTitleCompact: { fontSize: 23, lineHeight: 27, letterSpacing: -0.7 },
  welcomeBody: {
    color: COLORS.tone4,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 235,
  },
  panamaBadge: {
    width: 82,
    minHeight: 91,
    borderRadius: 18,
    backgroundColor: withAlpha(COLORS.tone1, 0.75),
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
  },
  panamaBadgeFlag: { fontSize: 29, marginBottom: 4 },
  panamaBadgeText: {
    color: COLORS.tone5,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: withAlpha(COLORS.tone1, 0.72),
    borderRadius: 14,
    marginBottom: 17,
  },
  trustText: { color: COLORS.tone5, fontSize: 10, fontWeight: '800' },
  trustDivider: { color: COLORS.tone4, paddingHorizontal: 5 },
  checkCard: {
    backgroundColor: COLORS.tone1,
    borderRadius: 23,
    padding: 19,
    borderWidth: 1,
    borderColor: COLORS.tone2,
    shadowColor: COLORS.tone5,
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 19 },
  cardHeadingIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.tone2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  cardHeadingIconText: {
    color: COLORS.tone5,
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '500',
  },
  cardTitle: {
    color: COLORS.tone5,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.35,
  },
  cardSubtitle: { color: COLORS.tone4, fontSize: 11, marginTop: 3 },
  secureMark: { fontSize: 15, opacity: 0.75 },
  ticketToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.tone2,
    padding: 5,
    borderRadius: 15,
    marginBottom: 10,
  },
  ticketOption: {
    flex: 1,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ticketOptionSelected: {
    backgroundColor: COLORS.tone5,
    borderColor: COLORS.tone5,
    shadowColor: COLORS.tone5,
    shadowOpacity: 0.07,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  ticketIcon: { fontSize: 20, marginRight: 8 },
  ticketTitle: { color: COLORS.tone5, fontSize: 13, fontWeight: '800' },
  ticketTitleSelected: { color: COLORS.tone1 },
  ticketSub: { color: COLORS.tone4, fontSize: 10, marginTop: 3 },
  ticketSubSelected: { color: COLORS.tone3 },
  inputLabel: {
    color: COLORS.tone5,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginTop: 20,
    marginBottom: 10,
  },
  kindScroll: { paddingBottom: 3, gap: 7 },
  kindChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    minHeight: 35,
    borderRadius: 20,
    backgroundColor: COLORS.tone2,
    borderWidth: 1,
    borderColor: COLORS.tone2,
    marginRight: 2,
  },
  kindChipActive: { backgroundColor: COLORS.tone5, borderColor: COLORS.tone5 },
  kindChipText: { color: COLORS.tone5, fontSize: 10, fontWeight: '700' },
  kindChipTextActive: { color: COLORS.tone1 },
  drawSelect: {
    minHeight: 59,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.tone2,
    backgroundColor: COLORS.tone1,
    paddingHorizontal: 11,
    borderRadius: 12,
    marginTop: 5,
    marginBottom: 20,
  },
  drawSelectIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.tone2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  drawSelectTitle: { color: COLORS.tone5, fontSize: 13, fontWeight: '800' },
  drawSelectSubtitle: { color: COLORS.tone4, fontSize: 10, marginTop: 3 },
  chevron: {
    color: COLORS.tone5,
    fontSize: 23,
    paddingHorizontal: 4,
    marginTop: -5,
  },
  emptyInline: {
    backgroundColor: COLORS.tone2,
    borderRadius: 11,
    padding: 12,
    marginBottom: 17,
  },
  emptyInlineText: { color: COLORS.tone4, fontSize: 12, lineHeight: 17 },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  digitHint: {
    color: COLORS.tone5,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  numberInputWrap: {
    height: 70,
    backgroundColor: COLORS.tone1,
    borderColor: COLORS.tone3,
    borderWidth: 1.5,
    borderRadius: 13,
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 9,
  },
  numberInput: {
    color: COLORS.tone5,
    fontSize: 31,
    letterSpacing: 9,
    textAlign: 'center',
    fontWeight: '800',
    padding: 0,
    paddingLeft: 9,
    height: '100%',
    fontVariant: ['tabular-nums'],
  },
  numberHelpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
    marginBottom: 18,
  },
  helperText: { color: COLORS.tone4, fontSize: 10 },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingLeft: 10,
  },
  scanIcon: { color: COLORS.tone5, fontSize: 16, fontWeight: '800' },
  scanButtonText: { color: COLORS.tone5, fontSize: 11, fontWeight: '800' },
  scanMessage: {
    color: COLORS.tone5,
    backgroundColor: COLORS.tone2,
    borderRadius: 8,
    padding: 9,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  fractionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 20,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.tone2,
    backgroundColor: COLORS.tone1,
    borderRadius: 9,
  },
  stepperButton: {
    width: 35,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { color: COLORS.tone5, fontSize: 19, fontWeight: '700' },
  fractionInput: {
    minWidth: 35,
    textAlign: 'center',
    color: COLORS.tone5,
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 3,
  },
  extrasToggle: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: COLORS.tone2,
    marginTop: 2,
  },
  extrasToggleText: { color: COLORS.tone5, fontSize: 11, fontWeight: '800' },
  extrasChevron: { color: COLORS.tone5, fontSize: 19 },
  extraField: { marginVertical: 7 },
  extraFieldsRow: { flexDirection: 'row', gap: 12, marginVertical: 7 },
  extraInput: {
    backgroundColor: COLORS.tone1,
    borderWidth: 1,
    borderColor: COLORS.tone2,
    borderRadius: 9,
    height: 42,
    paddingHorizontal: 11,
    color: COLORS.tone5,
    fontSize: 15,
    fontWeight: '700',
  },
  formError: {
    backgroundColor: COLORS.tone2,
    borderRadius: 9,
    padding: 10,
    marginBottom: 11,
  },
  formErrorText: {
    color: COLORS.tone5,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 51,
    borderRadius: 12,
    backgroundColor: COLORS.tone5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 3,
  },
  primaryButtonText: {
    color: COLORS.tone1,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.1,
  },
  buttonDisabled: { opacity: 0.55 },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 14,
  },
  privacyCheck: { color: COLORS.tone5, fontSize: 13, fontWeight: '900' },
  privacyText: { color: COLORS.tone4, fontSize: 10 },
  loadingCard: {
    backgroundColor: COLORS.tone1,
    minHeight: 120,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.tone2,
    gap: 10,
  },
  loadingText: { color: COLORS.tone4, fontSize: 12 },
  errorCard: {
    backgroundColor: COLORS.tone1,
    padding: 19,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.tone3,
  },
  errorTitle: {
    color: COLORS.tone5,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 7,
  },
  errorBody: { color: COLORS.tone4, fontSize: 12, lineHeight: 18 },
  retryButton: { alignSelf: 'flex-start', paddingVertical: 10, marginTop: 4 },
  retryText: { color: COLORS.tone5, fontWeight: '900', fontSize: 12 },
  latestSection: { marginTop: 24 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 13,
  },
  sectionTitle: {
    color: COLORS.tone5,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.55,
  },
  sectionAside: { color: COLORS.tone4, fontSize: 10, paddingBottom: 3 },
  latestCard: {
    backgroundColor: COLORS.tone1,
    borderWidth: 1,
    borderColor: COLORS.tone2,
    borderRadius: 17,
    padding: 14,
  },
  latestTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
  latestIcon: {
    width: 38,
    height: 38,
    backgroundColor: COLORS.tone2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  kindInitial: { color: COLORS.tone5, fontWeight: '900', fontSize: 15 },
  latestName: { color: COLORS.tone5, fontSize: 13, fontWeight: '900' },
  latestDate: { color: COLORS.tone4, fontSize: 10, marginTop: 3 },
  latestArrow: { color: COLORS.tone5, fontSize: 21, fontWeight: '600' },
  numberStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 9,
  },
  numberGroup: { alignItems: 'center', flex: 1 },
  numberGroupLarge: { flex: 1 },
  prizeCaption: {
    color: COLORS.tone4,
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 6,
  },
  numberBalls: { flexDirection: 'row', gap: 3, justifyContent: 'center' },
  numberBallsLarge: { gap: 4 },
  ball: {
    height: 27,
    minWidth: 22,
    paddingHorizontal: 3,
    borderRadius: 6,
    backgroundColor: COLORS.tone2,
    borderWidth: 1,
    borderColor: COLORS.tone3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballLarge: { height: 34, minWidth: 25 },
  ballText: {
    color: COLORS.tone5,
    fontSize: 15,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  ballTextLarge: { fontSize: 18 },
  viewAll: {
    color: COLORS.tone5,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '900',
    borderTopWidth: 1,
    borderColor: COLORS.tone2,
    paddingTop: 12,
    marginTop: 13,
  },
  footerNote: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 22,
  },
  footerShield: { color: COLORS.tone5, fontSize: 13 },
  footerText: { color: COLORS.tone4, fontSize: 9 },
  bottomNav: {
    height: 65,
    paddingBottom: 5,
    flexDirection: 'row',
    backgroundColor: COLORS.tone1,
    borderTopWidth: 1,
    borderTopColor: COLORS.tone2,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    maxWidth: 180,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navIcon: {
    color: COLORS.tone4,
    fontSize: 23,
    lineHeight: 25,
    fontWeight: '500',
  },
  navIconActive: { color: COLORS.tone5 },
  navText: { color: COLORS.tone4, fontSize: 9, fontWeight: '700' },
  navTextActive: { color: COLORS.tone5, fontWeight: '900' },
  resultsView: { paddingTop: 23 },
  historySearch: {
    minHeight: 46,
    backgroundColor: COLORS.tone1,
    borderColor: COLORS.tone2,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    color: COLORS.tone5,
    fontSize: 13,
    marginTop: 13,
  },
  historyKinds: { gap: 7, paddingVertical: 12 },
  historyKind: {
    borderWidth: 1,
    borderColor: COLORS.tone2,
    backgroundColor: COLORS.tone1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  historyKindSelected: { backgroundColor: COLORS.tone5, borderColor: COLORS.tone5 },
  historyKindText: { color: COLORS.tone4, fontSize: 11, fontWeight: '800' },
  historyKindTextSelected: { color: COLORS.tone1 },
  historyDateFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 },
  historyDateButton: {
    backgroundColor: COLORS.tone2,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  historyDateButtonDisabled: { opacity: 0.5 },
  historyDateText: { color: COLORS.tone5, fontSize: 10, fontWeight: '800' },
  clearFilters: { justifyContent: 'center', paddingHorizontal: 7 },
  clearFiltersText: { color: COLORS.tone4, fontSize: 10, fontWeight: '800' },
  alertsButton: {
    minHeight: 42,
    backgroundColor: COLORS.tone2,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  alertsButtonText: { color: COLORS.tone5, fontSize: 11, fontWeight: '800' },
  alertsHelp: { color: COLORS.tone4, fontSize: 10, lineHeight: 14, marginTop: -6, marginBottom: 13, paddingHorizontal: 3 },
  resultCard: {
    backgroundColor: COLORS.tone1,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.tone2,
    padding: 14,
    marginBottom: 13,
    overflow: 'hidden',
  },
  resultTicketTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultDateBadge: {
    width: 43,
    height: 49,
    borderRadius: 12,
    backgroundColor: COLORS.tone2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultDateMonth: {
    color: COLORS.tone5,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  resultDateDay: {
    color: COLORS.tone5,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 21,
  },
  ticketPerforation: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.tone2,
    marginTop: 14,
    marginBottom: 13,
  },
  firstPrizePanel: {
    alignItems: 'center',
    backgroundColor: COLORS.tone2,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  firstPrizeEyebrow: {
    color: COLORS.tone5,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  firstPrizeNumber: {
    color: COLORS.tone5,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    marginTop: 3,
  },
  firstPrizeNumberCompact: { fontSize: 38, letterSpacing: 1.4 },
  firstPrizeCaption: {
    color: COLORS.tone5,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  secondaryPrizeRow: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 1,
  },
  secondaryPrize: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  secondaryPrizeLabel: {
    color: COLORS.tone5,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  secondaryPrizeNumber: {
    color: COLORS.tone5,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1.2,
  },
  resultTicketAction: {
    minHeight: 45,
    backgroundColor: COLORS.tone5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: 11,
    marginHorizontal: -14,
    marginBottom: -14,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultActionButton: { flex: 1, minHeight: 45, justifyContent: 'center', alignItems: 'center' },
  resultTicketActionText: {
    color: COLORS.tone1,
    fontSize: 12,
    fontWeight: '900',
  },
  resultTicketActionArrow: {
    color: COLORS.tone1,
    fontSize: 25,
    lineHeight: 28,
    marginTop: -3,
  },
  drawKindIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.tone2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  resultCardKind: { color: COLORS.tone5, fontSize: 13, fontWeight: '900' },
  resultCardDate: { color: COLORS.tone4, fontSize: 12, marginTop: 4 },
  recentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.tone2,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 6,
  },
  recentDot: {
    width: 5,
    height: 5,
    backgroundColor: COLORS.tone5,
    borderRadius: 3,
  },
  recentText: {
    color: COLORS.tone5,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.35,
  },
  zodiacLine: {
    color: COLORS.tone4,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 11,
  },
  pendingRules: {
    color: COLORS.tone5,
    backgroundColor: COLORS.tone2,
    overflow: 'hidden',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 9,
    alignSelf: 'flex-start',
    marginTop: 11,
  },
  sourceLine: {
    color: COLORS.tone5,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 11,
  },
  emptyCard: {
    backgroundColor: COLORS.tone1,
    borderRadius: 17,
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: { color: COLORS.tone5, fontSize: 16, fontWeight: '900' },
  emptyBody: {
    color: COLORS.tone4,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: withAlpha(COLORS.tone5, 0.38),
    justifyContent: 'flex-end',
  },
  resultSheet: {
    backgroundColor: COLORS.tone1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 27,
    maxHeight: '90%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 39,
    height: 4,
    borderRadius: 4,
    backgroundColor: COLORS.tone3,
    marginBottom: 12,
  },
  resultStatus: {
    color: COLORS.tone5,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 1,
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  demoLabel: {
    color: COLORS.tone5,
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 5,
  },
  resultTicket: {
    color: COLORS.tone4,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  resultTitle: {
    color: COLORS.tone5,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.6,
    marginTop: 7,
  },
  resultBody: {
    color: COLORS.tone4,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 14,
  },
  amountCard: {
    backgroundColor: COLORS.tone2,
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    color: COLORS.tone5,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  amountValue: {
    color: COLORS.tone5,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  amountHint: { color: COLORS.tone4, fontSize: 10, marginTop: 2 },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.tone2,
    gap: 9,
  },
  matchLabel: { flex: 1, color: COLORS.tone5, fontSize: 10, fontWeight: '700' },
  matchAmount: {
    color: COLORS.tone5,
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'right',
  },
  warningBox: {
    backgroundColor: COLORS.tone2,
    padding: 10,
    borderRadius: 9,
    marginTop: 7,
  },
  warningText: { color: COLORS.tone5, fontSize: 10, lineHeight: 15 },
  resultMeta: {
    color: COLORS.tone4,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 14,
  },
  disclaimer: {
    color: COLORS.tone5,
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 11,
  },
  pickerSheet: {
    backgroundColor: COLORS.tone1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    maxHeight: '78%',
  },
  pickerTitle: {
    color: COLORS.tone5,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  pickerSubtitle: {
    color: COLORS.tone4,
    fontSize: 11,
    marginTop: 4,
    marginBottom: 13,
  },
  pickerList: { maxHeight: 360 },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.tone2,
  },
  pickerOptionSelected: { backgroundColor: COLORS.tone1 },
  pickerOptionTitle: { color: COLORS.tone5, fontSize: 12, fontWeight: '800' },
  pickerOptionDate: { color: COLORS.tone4, fontSize: 10, marginTop: 3 },
  selectedCheck: {
    color: COLORS.tone5,
    fontSize: 17,
    fontWeight: '900',
    paddingHorizontal: 8,
  },
  secondaryButton: {
    minHeight: 45,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.tone2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 13,
  },
  secondaryButtonText: { color: COLORS.tone5, fontWeight: '900', fontSize: 12 },
  cameraModal: {
    flex: 1,
    backgroundColor: COLORS.tone5,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  cameraClose: {
    width: 37,
    height: 37,
    backgroundColor: COLORS.tone5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCloseText: { color: COLORS.tone1, fontSize: 27, lineHeight: 30 },
  cameraTitle: { color: COLORS.tone1, fontSize: 17, fontWeight: '900' },
  cameraCloseSpacer: { width: 37 },
  cameraFrame: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 14,
    minHeight: 220,
  },
  camera: { flex: 1 },
  cameraUnavailable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.tone5,
  },
  scanGuide: { ...StyleSheet.absoluteFill },
  scanFrame: {
    position: 'absolute',
    width: '88%',
    height: 104,
    top: '61%',
    left: '50%',
    marginLeft: '-44%',
    marginTop: -52,
    borderRadius: 12,
    backgroundColor: withAlpha(COLORS.tone5, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanGuideText: {
    color: COLORS.tone1,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    backgroundColor: withAlpha(COLORS.tone5, 0.55),
    overflow: 'hidden',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  scanCornerTL: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.tone3,
    borderTopLeftRadius: 8,
  },
  scanCornerTR: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.tone3,
    borderTopRightRadius: 8,
  },
  scanCornerBL: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.tone3,
    borderBottomLeftRadius: 8,
  },
  scanCornerBR: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.tone3,
    borderBottomRightRadius: 8,
  },
  cameraInstruction: {
    color: COLORS.tone3,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingVertical: 14,
  },
  ocrCandidates: {
    maxHeight: 145,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ocrCandidate: {
    minWidth: 98,
    borderWidth: 1,
    borderColor: COLORS.tone5,
    borderRadius: 12,
    backgroundColor: COLORS.tone5,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  ocrCandidateText: {
    color: COLORS.tone1,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  ocrCandidateHint: { color: COLORS.tone3, fontSize: 9, marginTop: 3 },
})
