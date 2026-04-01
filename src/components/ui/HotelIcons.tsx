import {
  Hotel,
  Bed,
  UtensilsCrossed,
  Coffee,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  Star,
  Check,
  CheckCircle2,
  XCircle,
  Sparkles,
  Wifi,
  CreditCard,
  Shield,
  Clock,
  Baby,
  UsersRound,
  CalendarCheck,
  PhoneCall,
  MessageSquare,
  Globe,
  Armchair,
  Building2,
  Warehouse,
  Presentation,
  Utensils,
  ChefHat,
  Wine,
  Car,
  ParkingCircle,
  Dumbbell,
  Waves,
  Flower2,
  Tv2,
  Wind,
  LampDesk,
  LampFloor,
  BedDouble,
  BedSingle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideProps } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────────

export type IconName =
  | 'hotel'
  | 'bed'
  | 'utensils'
  | 'coffee'
  | 'phone'
  | 'mail'
  | 'location'
  | 'calendar'
  | 'users'
  | 'star'
  | 'check'
  | 'checkCircle'
  | 'xCircle'
  | 'sparkles'
  | 'wifi'
  | 'creditCard'
  | 'shield'
  | 'clock'
  | 'baby'
  | 'usersRound'
  | 'calendarCheck'
  | 'phoneCall'
  | 'message'
  | 'globe'
  | 'armchair'
  | 'building'
  | 'warehouse'
  | 'presentation'
  | 'chefHat'
  | 'wine'
  | 'car'
  | 'parking'
  | 'gym'
  | 'pool'
  | 'flower'
  | 'tv'
  | 'fan'
  | 'deskLamp'
  | 'floorLamp'
  | 'bedDouble'
  | 'bedSingle'

interface HotelIconProps extends Omit<LucideProps, 'ref'> {
  name: IconName
  size?: number
}

// ─── Mapping ────────────────────────────────────────────────────────────────────

const iconMap: Record<IconName, React.ComponentType<LucideProps>> = {
  hotel: Hotel,
  bed: Bed,
  utensils: UtensilsCrossed,
  coffee: Coffee,
  phone: Phone,
  mail: Mail,
  location: MapPin,
  calendar: Calendar,
  users: Users,
  star: Star,
  check: Check,
  checkCircle: CheckCircle2,
  xCircle: XCircle,
  sparkles: Sparkles,
  wifi: Wifi,
  creditCard: CreditCard,
  shield: Shield,
  clock: Clock,
  baby: Baby,
  usersRound: UsersRound,
  calendarCheck: CalendarCheck,
  phoneCall: PhoneCall,
  message: MessageSquare,
  globe: Globe,
  armchair: Armchair,
  building: Building2,
  warehouse: Warehouse,
  presentation: Presentation,
  chefHat: ChefHat,
  wine: Wine,
  car: Car,
  parking: ParkingCircle,
  gym: Dumbbell,
  pool: Waves,
  flower: Flower2,
  tv: Tv2,
  fan: Wind,
  deskLamp: LampDesk,
  floorLamp: LampFloor,
  bedDouble: BedDouble,
  bedSingle: BedSingle,
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function HotelIcon({ name, size = 20, className, ...props }: HotelIconProps) {
  const Icon = iconMap[name]

  if (!Icon) {
    console.warn(`HotelIcon: "${name}" not found`)
    return null
  }

  return <Icon size={size} className={cn('shrink-0', className)} {...props} />
}

// ─── Convenience exports ─────────────────────────────────────────────────────────

export const Icons = {
  Hotel: (props: Omit<LucideProps, 'ref'>) => <Hotel {...props} />,
  Bed: (props: Omit<LucideProps, 'ref'>) => <Bed {...props} />,
  Utensils: (props: Omit<LucideProps, 'ref'>) => <UtensilsCrossed {...props} />,
  Coffee: (props: Omit<LucideProps, 'ref'>) => <Coffee {...props} />,
  Phone: (props: Omit<LucideProps, 'ref'>) => <Phone {...props} />,
  Mail: (props: Omit<LucideProps, 'ref'>) => <Mail {...props} />,
  Location: (props: Omit<LucideProps, 'ref'>) => <MapPin {...props} />,
  Calendar: (props: Omit<LucideProps, 'ref'>) => <Calendar {...props} />,
  Users: (props: Omit<LucideProps, 'ref'>) => <Users {...props} />,
  Star: (props: Omit<LucideProps, 'ref'>) => <Star {...props} />,
  Check: (props: Omit<LucideProps, 'ref'>) => <Check {...props} />,
  CheckCircle: (props: Omit<LucideProps, 'ref'>) => <CheckCircle2 {...props} />,
  XCircle: (props: Omit<LucideProps, 'ref'>) => <XCircle {...props} />,
  Sparkles: (props: Omit<LucideProps, 'ref'>) => <Sparkles {...props} />,
  Wifi: (props: Omit<LucideProps, 'ref'>) => <Wifi {...props} />,
  CreditCard: (props: Omit<LucideProps, 'ref'>) => <CreditCard {...props} />,
  Shield: (props: Omit<LucideProps, 'ref'>) => <Shield {...props} />,
  Clock: (props: Omit<LucideProps, 'ref'>) => <Clock {...props} />,
  CalendarCheck: (props: Omit<LucideProps, 'ref'>) => <CalendarCheck {...props} />,
  Presentation: (props: Omit<LucideProps, 'ref'>) => <Presentation {...props} />,
  Dumbbell: (props: Omit<LucideProps, 'ref'>) => <Dumbbell {...props} />,
}
