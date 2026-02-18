import "dotenv/config";
import {
  AssetCondition,
  AssetStatus,
  InventoryChecklistItemCondition,
  InventoryChecklistStatus,
  InventoryChecklistType,
  OrgRole,
  PrismaClient,
  StaffRole,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

type SeedEvent = {
  code: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  venue: string;
  imageUrl: string;
};

type SeedAssetCategory = {
  name: string;
  description: string;
};

type SeedAsset = {
  categoryName: string;
  assetTag: string;
  name: string;
  serialNumber?: string;
  description?: string;
  status?: AssetStatus;
  condition?: AssetCondition;
  quantity: number;
  purchaseDate?: string;
  purchasePrice?: number;
  supplierName?: string;
  location: string;
  notes?: string;
  imageUrl?: string;
};

type SeedKit = {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  items: Array<
    | { assetTag: string; name: string; quantity: number }
    | { categoryName: string; name: string; quantity: number }
  >;
};

type SeedChecklist = {
  checklistNumber: string;
  eventCode: string;
  checklistType: InventoryChecklistType;
  responsibleName: string;
  notes?: string;
  status: InventoryChecklistStatus;
  signedBy?: string;
  signedAt?: string;
  items: Array<{
    assetTag: string;
    quantityExpected: number;
    quantityVerified: number;
    verified: boolean;
    verifiedBy?: string;
    condition: InventoryChecklistItemCondition;
    notes?: string;
  }>;
};

type SeedStaffMember = {
  id: string;
  fullName: string;
  role: StaffRole;
  email?: string;
  phone?: string;
  documentId?: string;
  notes?: string;
  eventCodes: string[];
};

type SeedTask = {
  id: string;
  title: string;
  description?: string;
  eventCode: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assigneeStaffMemberId: string;
  labels?: string[];
  dueAt?: string;
};

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Check your .env");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const prisma = createPrisma();

const organizationId = "org_snp";

const events2026: SeedEvent[] = [
  {
    code: "OPEN_ADCC_BUENOS_AIRES_2026",
    name: "Open ADCC Buenos Aires",
    startDate: "2026-04-18T09:00:00.000Z",
    endDate: "2026-04-18T22:00:00.000Z",
    venue: "Parque Olímpico de la Juventud, Buenos Aires, Argentina",
    imageUrl: "https://images.unsplash.com/photo-1544986581-efac024faf62",
  },
  {
    code: "AJP_TOUR_NACIONAL_SANTIAGO_2026",
    name: "AJP Tour Nacional Santiago",
    startDate: "2026-05-16T09:00:00.000Z",
    endDate: "2026-05-16T21:00:00.000Z",
    venue: "Centro de Deportes de Contacto, Santiago, Chile",
    imageUrl: "https://images.unsplash.com/photo-1610832958506-12-2SSF7OrE",
  },
  {
    code: "OPEN_ADCC_CARACAS_2026",
    name: "Open ADCC Caracas",
    startDate: "2026-06-13T09:00:00.000Z",
    endDate: "2026-06-13T22:00:00.000Z",
    venue: "Poliedro de Caracas, Caracas, Venezuela",
    imageUrl: "https://images.unsplash.com/photo-1588127333419-ReCqvCTtH9A",
  },
  {
    code: "OPEN_ADCC_SANTIAGO_2026",
    name: "Open ADCC Santiago",
    startDate: "2026-07-11T09:00:00.000Z",
    endDate: "2026-07-11T22:00:00.000Z",
    venue: "Movistar Arena Santiago, Santiago, Chile",
    imageUrl: "https://images.unsplash.com/photo-1610832958506-12-2SSF7OrE",
  },
  {
    code: "SANTO_NEGRO_SERIES_CORDOBA_2026",
    name: "Santo Negro Series Córdoba",
    description: "fecha a confirmar",
    startDate: "2026-10-15T09:00:00.000Z",
    endDate: "2026-10-15T22:00:00.000Z",
    venue: "Complejo Ferial Córdoba, Córdoba, Argentina",
    imageUrl: "https://images.unsplash.com/photo-1533752125192-KzKqR8gwfU4",
  },
  {
    code: "OPEN_ADCC_BOGOTA_2026",
    name: "Open ADCC Bogotá",
    description: "fecha a confirmar",
    startDate: "2026-10-15T09:00:00.000Z",
    endDate: "2026-10-15T22:00:00.000Z",
    venue: "Movistar Arena Bogotá, Bogotá, Colombia",
    imageUrl: "https://images.unsplash.com/photo-1542835435-2rRjG9-d4cw",
  },
  {
    code: "AJP_TOUR_NACIONAL_ARGENTINA_2026",
    name: "AJP Tour Nacional Argentina",
    startDate: "2026-09-05T09:00:00.000Z",
    endDate: "2026-09-05T21:00:00.000Z",
    venue: "Tecnópolis Arena, Buenos Aires, Argentina",
    imageUrl: "https://images.unsplash.com/photo-1544986581-efac024faf62",
  },
  {
    code: "ADCC_WORLD_CHAMPIONSHIP_2026",
    name: "ADCC World Championship",
    startDate: "2026-09-12T09:00:00.000Z",
    endDate: "2026-09-13T22:00:00.000Z",
    venue: "PGE Narodowy, Warsaw, Poland",
    imageUrl: "https://images.unsplash.com/photo-1544441893-aA32ilNrjho",
  },
  {
    code: "OPEN_ADCC_GUAYAQUIL_2026",
    name: "Open ADCC Guayaquil",
    startDate: "2026-09-26T09:00:00.000Z",
    endDate: "2026-09-26T22:00:00.000Z",
    venue: "Centro de Convenciones de Guayaquil, Guayaquil, Ecuador",
    imageUrl: "https://images.unsplash.com/photo-1591017403286-3CJGKH0sJfU4",
  },
  {
    code: "OPEN_ADCC_LIMA_2026",
    name: "Open ADCC Lima",
    description: "fecha a confirmar",
    startDate: "2026-10-15T09:00:00.000Z",
    endDate: "2026-10-15T22:00:00.000Z",
    venue: "Videna, Lima, Perú",
    imageUrl: "https://images.unsplash.com/photo-1509420316989-iUqez30uuiE",
  },
  {
    code: "OPEN_ARGENTINA_GI_NO_GI_2026",
    name: "Open Argentina Gi & No Gi",
    startDate: "2026-11-21T09:00:00.000Z",
    endDate: "2026-11-23T22:00:00.000Z",
    venue: "Parque Roca, Buenos Aires, Argentina",
    imageUrl: "https://images.unsplash.com/photo-1544986581-efac024faf62",
  },
  {
    code: "SOUTH_AMERICAN_ADCC_2026",
    name: "South American ADCC",
    startDate: "2026-12-12T09:00:00.000Z",
    endDate: "2026-12-12T22:00:00.000Z",
    venue: "Centro de Alto Rendimiento, Santiago, Chile",
    imageUrl: "https://images.unsplash.com/photo-1610832958506-12-2SSF7OrE",
  },
];

const assetCategories: SeedAssetCategory[] = [
  { name: "Cámaras", description: "Cuerpos de cámara para cobertura principal y backup." },
  { name: "Lentes", description: "Ópticas prime y zoom para broadcast y documental." },
  { name: "Audio", description: "Micrófonos, mixers y sistemas inalámbricos." },
  { name: "Iluminación", description: "Paneles, tubos, reflectores y controladores de luz." },
  { name: "Trípodes & Rigging", description: "Soportes, rigs, cabezales y estructuras." },
  { name: "Video", description: "Switchers, grabadores y conversores de señal." },
  { name: "Networking", description: "Routers, switches y distribución de red de producción." },
  { name: "Energía", description: "UPS, baterías, PDU y fuentes para operación continua." },
  { name: "Cables & Adaptadores", description: "Cableado técnico y adaptadores de campo." },
  { name: "Computación", description: "Laptops, workstations y periféricos de edición/live." },
  { name: "Accesorios", description: "Monitores, intercom y utilería técnica de soporte." },
  { name: "Cases & Transporte", description: "Cases rígidos, carros y logística de traslado." },
];

const assets: SeedAsset[] = [
  { categoryName: "Cámaras", assetTag: "CAM-001", name: "Sony FX3 Body A", serialNumber: "FX3-A-2026", quantity: 1, purchaseDate: "2026-01-10", purchasePrice: 3899, supplierName: "ProVideo AR", location: "Depósito Central - Estante A1", description: "Cámara principal para tatami central.", notes: "Incluye cage SmallRig.", imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32" },
  { categoryName: "Cámaras", assetTag: "CAM-002", name: "Sony FX3 Body B", serialNumber: "FX3-B-2026", quantity: 1, purchaseDate: "2026-01-11", purchasePrice: 3899, supplierName: "ProVideo AR", location: "Depósito Central - Estante A1", description: "Cámara backup para streaming." },
  { categoryName: "Cámaras", assetTag: "CAM-003", name: "Blackmagic Pocket 6K", serialNumber: "BMPCC6K-01", quantity: 1, purchaseDate: "2026-02-03", purchasePrice: 2499, supplierName: "Tecno Broadcast", location: "Depósito Central - Estante A2", description: "Cámara móvil para backstage." },
  { categoryName: "Cámaras", assetTag: "CAM-004", name: "GoPro Hero 12", serialNumber: "GPH12-7781", quantity: 2, purchaseDate: "2026-02-20", purchasePrice: 499, supplierName: "Action Gear", location: "Depósito Central - Cajón Acción", description: "POV accesos y time-lapse." },

  { categoryName: "Lentes", assetTag: "LEN-001", name: "Sigma 24-70mm f/2.8", serialNumber: "SIG2470-01", quantity: 1, purchaseDate: "2026-01-15", purchasePrice: 1099, supplierName: "PhotoPro", location: "Depósito Central - Estante B1", description: "Lente estándar cobertura general." },
  { categoryName: "Lentes", assetTag: "LEN-002", name: "Sony 70-200mm f/2.8", serialNumber: "SON70200-02", quantity: 1, purchaseDate: "2026-01-15", purchasePrice: 2599, supplierName: "PhotoPro", location: "Depósito Central - Estante B1", description: "Plano cerrado en tarima principal." },
  { categoryName: "Lentes", assetTag: "LEN-003", name: "Sony 16-35mm f/2.8", serialNumber: "SON1635-03", quantity: 1, purchaseDate: "2026-03-01", purchasePrice: 2199, supplierName: "PhotoPro", location: "Depósito Central - Estante B2", description: "Wide para cobertura arena." },
  { categoryName: "Lentes", assetTag: "LEN-004", name: "Sigma 35mm f/1.4", serialNumber: "SIG35-04", quantity: 1, location: "Depósito Central - Estante B2", description: "Prime para entrevistas." },

  { categoryName: "Audio", assetTag: "AUD-001", name: "Mixer Digital X32 Compact", serialNumber: "X32C-009", quantity: 1, purchaseDate: "2026-01-18", purchasePrice: 1890, supplierName: "Sonido Pro", location: "Depósito Audio - Rack 1", description: "Control FOH principal." },
  { categoryName: "Audio", assetTag: "AUD-002", name: "Shure SM58 Set", serialNumber: "SM58-SET-01", quantity: 6, purchaseDate: "2026-01-19", purchasePrice: 1200, supplierName: "Sonido Pro", location: "Depósito Audio - Rack 2", description: "Micrófonos mano para anuncio y entrevistas." },
  { categoryName: "Audio", assetTag: "AUD-003", name: "Wireless Lavalier Kit", serialNumber: "WLAV-332", quantity: 4, purchaseDate: "2026-02-10", purchasePrice: 980, supplierName: "Audio Networks", location: "Depósito Audio - Rack 2", description: "Set de solaperos para comentaristas." },
  { categoryName: "Audio", assetTag: "AUD-004", name: "Field Recorder Zoom F6", serialNumber: "ZF6-3320", quantity: 1, status: AssetStatus.DAMAGED, condition: AssetCondition.BROKEN, location: "Taller Técnico", description: "Grabador dañado en conector XLR.", notes: "Pendiente servicio técnico." },

  { categoryName: "Iluminación", assetTag: "LGT-001", name: "Aputure 300D II", serialNumber: "AP300D-1", quantity: 2, purchaseDate: "2026-02-05", purchasePrice: 2200, supplierName: "Lighting House", location: "Depósito Iluminación - Zona C", description: "Key light para set de prensa." },
  { categoryName: "Iluminación", assetTag: "LGT-002", name: "Nanlite PavoTube 30C", serialNumber: "NAN30C-2", quantity: 6, purchaseDate: "2026-02-05", purchasePrice: 1800, supplierName: "Lighting House", location: "Depósito Iluminación - Zona C", description: "Tubos RGB para ambientación." },
  { categoryName: "Iluminación", assetTag: "LGT-003", name: "Litepanel Astra 6X", serialNumber: "ASTRA6X-3", quantity: 3, purchaseDate: "2026-02-12", purchasePrice: 2700, supplierName: "Lighting House", location: "Depósito Iluminación - Zona C", description: "Panel LED para cobertura lateral." },
  { categoryName: "Iluminación", assetTag: "LGT-004", name: "Softbox Dome 90", serialNumber: "DOM90-14", quantity: 4, location: "Depósito Iluminación - Zona C", description: "Difusores para fuentes principales." },

  { categoryName: "Trípodes & Rigging", assetTag: "RIG-001", name: "Sachtler Flowtech 75", serialNumber: "SFL75-11", quantity: 3, purchaseDate: "2026-03-01", purchasePrice: 3900, supplierName: "Grip Master", location: "Depósito Rigging - R1", description: "Trípodes livianos para cámara principal." },
  { categoryName: "Trípodes & Rigging", assetTag: "RIG-002", name: "Manfrotto Heavy Duty Tripod", serialNumber: "MAN-HD-22", quantity: 3, purchaseDate: "2026-03-01", purchasePrice: 1650, supplierName: "Grip Master", location: "Depósito Rigging - R1", description: "Soporte para planos estáticos largos." },
  { categoryName: "Trípodes & Rigging", assetTag: "RIG-003", name: "C-Stand Kit", serialNumber: "CST-55", quantity: 8, purchaseDate: "2026-03-02", purchasePrice: 1200, supplierName: "Grip Master", location: "Depósito Rigging - R2", description: "Soporte para luces y accesorios." },
  { categoryName: "Trípodes & Rigging", assetTag: "RIG-004", name: "Safety Cable Set", serialNumber: "SAFE-91", quantity: 20, location: "Depósito Rigging - R2", description: "Cables de seguridad para estructuras." },

  { categoryName: "Video", assetTag: "VID-001", name: "ATEM Television Studio HD8", serialNumber: "ATEM-HD8-01", quantity: 1, purchaseDate: "2026-01-25", purchasePrice: 3799, supplierName: "Video Systems", location: "Control Room - Rack V1", description: "Switcher principal para transmisión." },
  { categoryName: "Video", assetTag: "VID-002", name: "Blackmagic HyperDeck Studio", serialNumber: "HYPD-02", quantity: 2, purchaseDate: "2026-01-25", purchasePrice: 2998, supplierName: "Video Systems", location: "Control Room - Rack V1", description: "Grabador de programa limpio y backup." },
  { categoryName: "Video", assetTag: "VID-003", name: "Decimator MD-HX", serialNumber: "DECM-40", quantity: 4, purchaseDate: "2026-03-08", purchasePrice: 1180, supplierName: "Video Systems", location: "Control Room - Rack V2", description: "Conversor HDMI/SDI bidireccional." },
  { categoryName: "Video", assetTag: "VID-004", name: "Capture Card 4K", serialNumber: "CC4K-778", quantity: 3, location: "Control Room - Rack V2", description: "Captura de fuentes externas." },

  { categoryName: "Networking", assetTag: "NET-001", name: "Mikrotik CCR Router", serialNumber: "MKR-001", quantity: 1, purchaseDate: "2026-02-14", purchasePrice: 980, supplierName: "Net Integrators", location: "NOC - Rack N1", description: "Router principal de producción." },
  { categoryName: "Networking", assetTag: "NET-002", name: "Ubiquiti 24p Managed Switch", serialNumber: "UB24-22", quantity: 2, purchaseDate: "2026-02-14", purchasePrice: 1560, supplierName: "Net Integrators", location: "NOC - Rack N1", description: "Switch PoE y distribución de edge." },
  { categoryName: "Networking", assetTag: "NET-003", name: "Wi-Fi AP Set", serialNumber: "AP-SET-31", quantity: 6, purchaseDate: "2026-02-20", purchasePrice: 1320, supplierName: "Net Integrators", location: "NOC - Rack N2", description: "Puntos de acceso para staff y producción." },
  { categoryName: "Networking", assetTag: "NET-004", name: "SFP Module Pack", serialNumber: "SFP-55", quantity: 12, location: "NOC - Rack N2", description: "Módulos ópticos 1G/10G." },

  { categoryName: "Energía", assetTag: "PWR-001", name: "UPS Online 3000VA", serialNumber: "UPS3K-44", quantity: 2, purchaseDate: "2026-03-12", purchasePrice: 2400, supplierName: "Power Solutions", location: "Energía - Rack P1", description: "Respaldo para control room y red." },
  { categoryName: "Energía", assetTag: "PWR-002", name: "Power Distribution Unit", serialNumber: "PDU-22", quantity: 6, purchaseDate: "2026-03-12", purchasePrice: 720, supplierName: "Power Solutions", location: "Energía - Rack P1", description: "Distribución eléctrica en racks." },
  { categoryName: "Energía", assetTag: "PWR-003", name: "V-Mount Battery Pack", serialNumber: "VMNT-91", quantity: 12, purchaseDate: "2026-03-15", purchasePrice: 3600, supplierName: "Power Solutions", location: "Energía - Rack P2", description: "Baterías para cámaras y luces." },
  { categoryName: "Energía", assetTag: "PWR-004", name: "Portable Generator 7kW", serialNumber: "GEN7KW-3", quantity: 1, status: AssetStatus.LOST, condition: AssetCondition.POOR, location: "Logística Externa", description: "Generador no localizado tras evento.", notes: "En investigación administrativa." },

  { categoryName: "Cables & Adaptadores", assetTag: "CAB-001", name: "XLR Cable 10m", serialNumber: "XLR10M-01", quantity: 24, purchaseDate: "2026-01-08", purchasePrice: 480, supplierName: "Cable Tech", location: "Depósito Cables - CA1", description: "Cableado audio principal." },
  { categoryName: "Cables & Adaptadores", assetTag: "CAB-002", name: "SDI Cable 30m", serialNumber: "SDI30M-02", quantity: 20, purchaseDate: "2026-01-08", purchasePrice: 900, supplierName: "Cable Tech", location: "Depósito Cables - CA1", description: "Tendidos largos de video SDI." },
  { categoryName: "Cables & Adaptadores", assetTag: "CAB-003", name: "HDMI Cable 5m", serialNumber: "HDMI5M-03", quantity: 30, purchaseDate: "2026-01-08", purchasePrice: 360, supplierName: "Cable Tech", location: "Depósito Cables - CA2", description: "Interconexión de monitores y convertidores." },
  { categoryName: "Cables & Adaptadores", assetTag: "CAB-004", name: "Adapter Kit USB-C/HDMI/SDI", serialNumber: "ADPT-04", quantity: 16, condition: AssetCondition.POOR, location: "Depósito Cables - CA2", description: "Kit multipropósito para laptops y cámaras." },

  { categoryName: "Computación", assetTag: "CPU-001", name: "MacBook Pro M3 Max", serialNumber: "MBP-M3-01", quantity: 2, purchaseDate: "2026-02-01", purchasePrice: 7200, supplierName: "Compute AR", location: "Postproducción - Mesa 1", description: "Edición rápida y replay." },
  { categoryName: "Computación", assetTag: "CPU-002", name: "Dell Precision Workstation", serialNumber: "DLPREC-2026", quantity: 1, purchaseDate: "2026-02-02", purchasePrice: 4100, supplierName: "Compute AR", location: "Postproducción - Mesa 2", description: "Render y transcoding principal." },
  { categoryName: "Computación", assetTag: "CPU-003", name: "Lenovo ThinkPad Ops", serialNumber: "TP-OPS-03", quantity: 3, purchaseDate: "2026-02-03", purchasePrice: 3900, supplierName: "Compute AR", location: "Operaciones - Oficina", description: "Control de planillas y coordinación logística." },
  { categoryName: "Computación", assetTag: "CPU-004", name: "Tablet iPad Air", serialNumber: "IPAD-04", quantity: 5, purchaseDate: "2026-02-03", purchasePrice: 2800, supplierName: "Compute AR", location: "Operaciones - Oficina", description: "Control de checklists en campo." },

  { categoryName: "Accesorios", assetTag: "ACC-001", name: "Director Monitor 17in", serialNumber: "MON17-01", quantity: 2, purchaseDate: "2026-03-20", purchasePrice: 1600, supplierName: "Stage Supplies", location: "Accesorios - AC1", description: "Monitoreo de programa para dirección." },
  { categoryName: "Accesorios", assetTag: "ACC-002", name: "Intercom Beltpack Set", serialNumber: "INT-BP-02", quantity: 8, purchaseDate: "2026-03-20", purchasePrice: 3200, supplierName: "Stage Supplies", location: "Accesorios - AC1", description: "Comunicación interna de producción." },
  { categoryName: "Accesorios", assetTag: "ACC-003", name: "Headset Closed Back", serialNumber: "HDST-03", quantity: 14, purchaseDate: "2026-03-21", purchasePrice: 1120, supplierName: "Stage Supplies", location: "Accesorios - AC2", description: "Auriculares para intercom y monitoreo." },
  { categoryName: "Accesorios", assetTag: "ACC-004", name: "Field Toolkit", serialNumber: "FTK-04", quantity: 4, location: "Accesorios - AC2", description: "Herramientas rápidas de mantenimiento en venue." },

  { categoryName: "Cases & Transporte", assetTag: "CAS-001", name: "Pelican Camera Case", serialNumber: "PEL-CAM-01", quantity: 6, purchaseDate: "2026-01-28", purchasePrice: 2100, supplierName: "LogiCases", location: "Depósito Transporte - T1", description: "Case rígido para cámara y accesorios." },
  { categoryName: "Cases & Transporte", assetTag: "CAS-002", name: "Rack Flight Case 12U", serialNumber: "RACK12U-02", quantity: 3, purchaseDate: "2026-01-28", purchasePrice: 1800, supplierName: "LogiCases", location: "Depósito Transporte - T1", description: "Transporte de equipamiento de red y video." },
  { categoryName: "Cases & Transporte", assetTag: "CAS-003", name: "Cable Trunk", serialNumber: "CBTRK-03", quantity: 8, purchaseDate: "2026-01-29", purchasePrice: 960, supplierName: "LogiCases", location: "Depósito Transporte - T2", description: "Baúles para cableado clasificado." },
  { categoryName: "Cases & Transporte", assetTag: "CAS-004", name: "Magliner Cart", serialNumber: "MGL-04", quantity: 3, status: AssetStatus.DAMAGED, condition: AssetCondition.POOR, location: "Taller Logística", description: "Carro de carga con rueda dañada.", notes: "Requiere reemplazo de kit de ruedas." },
];

const kits: SeedKit[] = [
  {
    id: "kit_seed_broadcast_core",
    name: "Broadcast Core Kit",
    description: "Setup base para transmisión multicámara.",
    eventType: "Jiu-Jitsu Championship",
    items: [
      { assetTag: "VID-001", name: "ATEM switcher", quantity: 1 },
      { assetTag: "VID-002", name: "HyperDeck recorder", quantity: 1 },
      { assetTag: "CAM-001", name: "Main camera", quantity: 1 },
      { assetTag: "NET-002", name: "Managed switch", quantity: 1 },
    ],
  },
  {
    id: "kit_seed_audio_interview",
    name: "Audio Interview Kit",
    description: "Kit para entrevistas y zona mixta.",
    eventType: "Press & Media",
    items: [
      { assetTag: "AUD-002", name: "SM58 microphones", quantity: 2 },
      { assetTag: "AUD-003", name: "Wireless lavaliers", quantity: 2 },
      { assetTag: "CAB-001", name: "XLR pack", quantity: 6 },
      { categoryName: "Accesorios", name: "Monitoring accessories", quantity: 2 },
    ],
  },
  {
    id: "kit_seed_operations_field",
    name: "Operations Field Kit",
    description: "Elementos de soporte operativo para venue.",
    eventType: "Ops Field",
    items: [
      { assetTag: "CPU-004", name: "Tablets", quantity: 2 },
      { assetTag: "PWR-001", name: "UPS backup", quantity: 1 },
      { assetTag: "CAS-004", name: "Transport cart", quantity: 1 },
      { categoryName: "Cables & Adaptadores", name: "Cable reserve", quantity: 10 },
    ],
  },
];

const checklists: SeedChecklist[] = [
  {
    checklistNumber: "CHK-SEED-2026-001",
    eventCode: "OPEN_ADCC_BUENOS_AIRES_2026",
    checklistType: InventoryChecklistType.LOADING,
    responsibleName: "Coordinación Logística BA",
    notes: "Checklist demo pre-carga.",
    status: InventoryChecklistStatus.COMPLETED,
    items: [
      {
        assetTag: "CAM-001",
        quantityExpected: 1,
        quantityVerified: 1,
        verified: true,
        verifiedBy: "Logística BA",
        condition: InventoryChecklistItemCondition.GOOD,
      },
      {
        assetTag: "VID-001",
        quantityExpected: 1,
        quantityVerified: 1,
        verified: true,
        verifiedBy: "Logística BA",
        condition: InventoryChecklistItemCondition.GOOD,
      },
      {
        assetTag: "CAB-002",
        quantityExpected: 8,
        quantityVerified: 7,
        verified: true,
        verifiedBy: "Logística BA",
        condition: InventoryChecklistItemCondition.DAMAGED,
        notes: "1 cable con conector dañado.",
      },
    ],
  },
  {
    checklistNumber: "CHK-SEED-2026-002",
    eventCode: "AJP_TOUR_NACIONAL_SANTIAGO_2026",
    checklistType: InventoryChecklistType.UNLOADING,
    responsibleName: "Operaciones Santiago",
    notes: "Checklist demo descarga.",
    status: InventoryChecklistStatus.IN_PROGRESS,
    items: [
      {
        assetTag: "AUD-001",
        quantityExpected: 1,
        quantityVerified: 1,
        verified: true,
        verifiedBy: "Ops Santiago",
        condition: InventoryChecklistItemCondition.GOOD,
      },
      {
        assetTag: "NET-001",
        quantityExpected: 1,
        quantityVerified: 0,
        verified: false,
        condition: InventoryChecklistItemCondition.GOOD,
      },
      {
        assetTag: "CPU-001",
        quantityExpected: 1,
        quantityVerified: 0,
        verified: false,
        condition: InventoryChecklistItemCondition.MISSING,
        notes: "Equipo aún en tránsito.",
      },
    ],
  },
];

const staffMembers: SeedStaffMember[] = [
  { id: "staff_seed_ops_01", fullName: "Camila Rojas", role: StaffRole.PRODUCTION, email: "camila.rojas@snp.local", eventCodes: ["OPEN_ADCC_BUENOS_AIRES_2026", "AJP_TOUR_NACIONAL_SANTIAGO_2026"] },
  { id: "staff_seed_ops_02", fullName: "Matias Cabrera", role: StaffRole.LOGISTICS, email: "matias.cabrera@snp.local", eventCodes: ["OPEN_ADCC_BUENOS_AIRES_2026", "OPEN_ADCC_CARACAS_2026"] },
  { id: "staff_seed_ops_03", fullName: "Lucia Nunez", role: StaffRole.STAFF, email: "lucia.nunez@snp.local", eventCodes: ["OPEN_ADCC_BUENOS_AIRES_2026"] },
  { id: "staff_seed_ops_04", fullName: "Diego Acosta", role: StaffRole.SECURITY, email: "diego.acosta@snp.local", eventCodes: ["OPEN_ADCC_BUENOS_AIRES_2026", "OPEN_ADCC_CARACAS_2026"] },
  { id: "staff_seed_ops_05", fullName: "Agustina Vera", role: StaffRole.OTHER, email: "agustina.vera@snp.local", eventCodes: ["OPEN_ADCC_BUENOS_AIRES_2026"] },
  { id: "staff_seed_ops_06", fullName: "Sofia Molina", role: StaffRole.TICKETING, email: "sofia.molina@snp.local", eventCodes: ["AJP_TOUR_NACIONAL_SANTIAGO_2026", "OPEN_ADCC_CARACAS_2026"] },
  { id: "staff_seed_ops_07", fullName: "Nicolas Bravo", role: StaffRole.LOGISTICS, email: "nicolas.bravo@snp.local", eventCodes: ["AJP_TOUR_NACIONAL_SANTIAGO_2026"] },
  { id: "staff_seed_ops_08", fullName: "Paula Diaz", role: StaffRole.STAFF, email: "paula.diaz@snp.local", eventCodes: ["AJP_TOUR_NACIONAL_SANTIAGO_2026"] },
  { id: "staff_seed_ops_09", fullName: "Franco Ortega", role: StaffRole.REFEREE, email: "franco.ortega@snp.local", eventCodes: ["AJP_TOUR_NACIONAL_SANTIAGO_2026", "OPEN_ADCC_CARACAS_2026"] },
  { id: "staff_seed_ops_10", fullName: "Micaela Soto", role: StaffRole.SECURITY, email: "micaela.soto@snp.local", eventCodes: ["AJP_TOUR_NACIONAL_SANTIAGO_2026"] },
  { id: "staff_seed_ops_11", fullName: "Lautaro Paz", role: StaffRole.STAFF, email: "lautaro.paz@snp.local", eventCodes: ["OPEN_ADCC_CARACAS_2026"] },
  { id: "staff_seed_ops_12", fullName: "Julieta Benitez", role: StaffRole.LOGISTICS, email: "julieta.benitez@snp.local", eventCodes: ["OPEN_ADCC_CARACAS_2026"] },
  { id: "staff_seed_ops_13", fullName: "Ezequiel Ramirez", role: StaffRole.PRODUCTION, email: "ezequiel.ramirez@snp.local", eventCodes: ["OPEN_ADCC_CARACAS_2026"] },
  { id: "staff_seed_ops_14", fullName: "Valentina Prieto", role: StaffRole.STAFF, email: "valentina.prieto@snp.local", eventCodes: ["OPEN_ADCC_CARACAS_2026"] },
  { id: "staff_seed_ops_15", fullName: "Thiago Farias", role: StaffRole.MEDIC, email: "thiago.farias@snp.local", eventCodes: ["OPEN_ADCC_BUENOS_AIRES_2026", "OPEN_ADCC_CARACAS_2026"] },
  { id: "staff_seed_ops_16", fullName: "Milagros Ibarra", role: StaffRole.CLEANING, email: "milagros.ibarra@snp.local", eventCodes: ["OPEN_ADCC_BUENOS_AIRES_2026", "AJP_TOUR_NACIONAL_SANTIAGO_2026"] },
  { id: "staff_seed_ops_17", fullName: "Bruno Salas", role: StaffRole.REFEREE, email: "bruno.salas@snp.local", eventCodes: ["OPEN_ADCC_BUENOS_AIRES_2026"] },
  { id: "staff_seed_ops_18", fullName: "Florencia Quiroga", role: StaffRole.OTHER, email: "florencia.quiroga@snp.local", eventCodes: ["AJP_TOUR_NACIONAL_SANTIAGO_2026", "OPEN_ADCC_CARACAS_2026"] },
];

const seededTasks: SeedTask[] = [
  { id: "task_seed_ops_001", title: "Configurar switcher principal", description: "Verificar entradas SDI y macros de escena.", eventCode: "OPEN_ADCC_BUENOS_AIRES_2026", status: TaskStatus.TODO, priority: TaskPriority.HIGH, type: TaskType.GENERAL, assigneeStaffMemberId: "staff_seed_ops_01", labels: ["video", "broadcast"], dueAt: "2026-04-17T18:00:00.000Z" },
  { id: "task_seed_ops_002", title: "Control de inventario de audio", description: "Confirmar kits de entrevistas y backup.", eventCode: "OPEN_ADCC_BUENOS_AIRES_2026", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, type: TaskType.INVENTORY, assigneeStaffMemberId: "staff_seed_ops_02", labels: ["audio", "inventory"], dueAt: "2026-04-17T19:00:00.000Z" },
  { id: "task_seed_ops_003", title: "Acreditaciones staff puerta norte", description: "Validar credenciales y flujo de accesos.", eventCode: "OPEN_ADCC_BUENOS_AIRES_2026", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, type: TaskType.GENERAL, assigneeStaffMemberId: "staff_seed_ops_04", labels: ["access"], dueAt: "2026-04-18T12:30:00.000Z" },
  { id: "task_seed_ops_004", title: "Plan de contingencia de energía", description: "Probar UPS de NOC y control room.", eventCode: "OPEN_ADCC_BUENOS_AIRES_2026", status: TaskStatus.BLOCKED, priority: TaskPriority.CRITICAL, type: TaskType.GENERAL, assigneeStaffMemberId: "staff_seed_ops_15", labels: ["power", "risk"] },
  { id: "task_seed_ops_005", title: "Checklist final de tatamis", description: "Confirmar setup operativo antes de apertura.", eventCode: "OPEN_ADCC_BUENOS_AIRES_2026", status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, type: TaskType.REFEREE, assigneeStaffMemberId: "staff_seed_ops_17", labels: ["tatami"], dueAt: "2026-04-18T08:00:00.000Z" },
  { id: "task_seed_ops_006", title: "Briefing logística carga-in", description: "Coordinar horarios de ingreso de proveedores.", eventCode: "AJP_TOUR_NACIONAL_SANTIAGO_2026", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, type: TaskType.WORK_ORDER, assigneeStaffMemberId: "staff_seed_ops_07", labels: ["logistics"], dueAt: "2026-05-15T17:00:00.000Z" },
  { id: "task_seed_ops_007", title: "Cobertura de incidencias en pista", description: "Registrar y escalar incidencias críticas.", eventCode: "AJP_TOUR_NACIONAL_SANTIAGO_2026", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, type: TaskType.INCIDENT, assigneeStaffMemberId: "staff_seed_ops_09", labels: ["incident"] },
  { id: "task_seed_ops_008", title: "Revisión de zonas de limpieza", description: "Validar turnos y stock de insumos.", eventCode: "AJP_TOUR_NACIONAL_SANTIAGO_2026", status: TaskStatus.BLOCKED, priority: TaskPriority.LOW, type: TaskType.GENERAL, assigneeStaffMemberId: "staff_seed_ops_16", labels: ["venue"] },
  { id: "task_seed_ops_009", title: "Estado de sponsors en LED", description: "Confirmar assets visuales y tiempos de salida.", eventCode: "OPEN_ADCC_CARACAS_2026", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, type: TaskType.SPONSORSHIP, assigneeStaffMemberId: "staff_seed_ops_13", labels: ["sponsor", "led"] },
  { id: "task_seed_ops_010", title: "Control de seguridad backstage", description: "Asegurar perímetro y accesos restringidos.", eventCode: "OPEN_ADCC_CARACAS_2026", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, type: TaskType.GENERAL, assigneeStaffMemberId: "staff_seed_ops_11", labels: ["security"] },
  { id: "task_seed_ops_011", title: "Conteo de activos al cierre", description: "Cerrar checklist de retorno por categoría.", eventCode: "OPEN_ADCC_CARACAS_2026", status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, type: TaskType.INVENTORY, assigneeStaffMemberId: "staff_seed_ops_12", labels: ["inventory", "closing"] },
  { id: "task_seed_ops_012", title: "Reubicación de staff por zona", description: "Actualizar responsables ante cambios de flujo.", eventCode: "OPEN_ADCC_CARACAS_2026", status: TaskStatus.BLOCKED, priority: TaskPriority.HIGH, type: TaskType.GENERAL, assigneeStaffMemberId: "staff_seed_ops_18", labels: ["staffing"] },
];

const fallbackAssetImageUrls = [
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
  "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
  "https://images.unsplash.com/photo-1516724562728-afc824a36e84",
];

function eventImageKey(code: string): string {
  return `seed/external/${code}.jpg`;
}

function assetImageKey(assetTag: string): string {
  return `seed/external/assets/${assetTag.toLowerCase()}.jpg`;
}

async function ensureAdminAndMembership(orgId: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPlainPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!adminEmail || !adminPlainPassword) {
    throw new Error(
      "ADMIN_EMAIL y ADMIN_INITIAL_PASSWORD son obligatorias para crear el SUPER_ADMIN (defínelas en .env)",
    );
  }

  const passwordHash = await bcrypt.hash(adminPlainPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: "Administrador SNP",
      isActive: true,
      passwordHash,
    },
    create: {
      email: adminEmail,
      passwordHash,
      fullName: "Administrador SNP",
      isActive: true,
    },
  });

  await prisma.orgMembership.upsert({
    where: {
      organizationId_userId_role: {
        organizationId: orgId,
        userId: admin.id,
        role: OrgRole.SUPER_ADMIN,
      },
    },
    update: {},
    create: {
      organizationId: orgId,
      userId: admin.id,
      role: OrgRole.SUPER_ADMIN,
    },
  });

  return { admin, adminEmail };
}

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: organizationId },
    update: { name: "Santo Negro Producciones" },
    create: { id: organizationId, name: "Santo Negro Producciones" },
  });

  const { admin, adminEmail } = await ensureAdminAndMembership(org.id);

  let createdEvents = 0;
  let updatedEvents = 0;
  const eventIdByCode = new Map<string, string>();

  for (const eventDef of events2026) {
    const where = {
      organizationId_code: {
        organizationId: org.id,
        code: eventDef.code,
      },
    } as const;

    const existing = await prisma.event.findUnique({ where, select: { id: true } });

    const event = await prisma.event.upsert({
      where,
      update: {
        name: eventDef.name,
        description: eventDef.description ?? null,
        startDate: new Date(eventDef.startDate),
        endDate: new Date(eventDef.endDate),
        venue: eventDef.venue,
        imageUrl: eventDef.imageUrl,
        imageKey: eventImageKey(eventDef.code),
      },
      create: {
        organizationId: org.id,
        code: eventDef.code,
        name: eventDef.name,
        description: eventDef.description ?? null,
        startDate: new Date(eventDef.startDate),
        endDate: new Date(eventDef.endDate),
        venue: eventDef.venue,
        imageUrl: eventDef.imageUrl,
        imageKey: eventImageKey(eventDef.code),
      },
      select: { id: true },
    });

    if (existing) {
      updatedEvents += 1;
    } else {
      createdEvents += 1;
    }

    eventIdByCode.set(eventDef.code, event.id);
  }

  let createdStaffMembers = 0;
  let updatedStaffMembers = 0;

  for (const staffMember of staffMembers) {
    const existing = await prisma.staffMember.findUnique({
      where: { id: staffMember.id },
      select: { id: true },
    });

    await prisma.staffMember.upsert({
      where: { id: staffMember.id },
      update: {
        organizationId: org.id,
        fullName: staffMember.fullName,
        documentId: staffMember.documentId ?? null,
        phone: staffMember.phone ?? null,
        email: staffMember.email ?? null,
        notes: staffMember.notes ?? null,
      },
      create: {
        id: staffMember.id,
        organizationId: org.id,
        fullName: staffMember.fullName,
        documentId: staffMember.documentId ?? null,
        phone: staffMember.phone ?? null,
        email: staffMember.email ?? null,
        notes: staffMember.notes ?? null,
      },
    });

    if (existing) {
      updatedStaffMembers += 1;
    } else {
      createdStaffMembers += 1;
    }
  }

  let createdStaffAssignments = 0;
  let updatedStaffAssignments = 0;

  for (const staffMember of staffMembers) {
    for (const eventCode of staffMember.eventCodes) {
      const eventId = eventIdByCode.get(eventCode);
      if (!eventId) {
        throw new Error(`Missing event for staff assignment eventCode=${eventCode}`);
      }

      const assignmentId = `staff_assignment_${staffMember.id}_${eventCode}`.toLowerCase();
      const existing = await prisma.staffAssignment.findUnique({
        where: { id: assignmentId },
        select: { id: true },
      });

      await prisma.staffAssignment.upsert({
        where: { id: assignmentId },
        update: {
          eventId,
          staffMemberId: staffMember.id,
          role: staffMember.role,
          zoneId: null,
          shiftId: null,
          startsAt: null,
          endsAt: null,
        },
        create: {
          id: assignmentId,
          eventId,
          staffMemberId: staffMember.id,
          role: staffMember.role,
          zoneId: null,
          shiftId: null,
          startsAt: null,
          endsAt: null,
        },
      });

      if (existing) {
        updatedStaffAssignments += 1;
      } else {
        createdStaffAssignments += 1;
      }
    }
  }

  const knownStaffIds = new Set(staffMembers.map((staffMember) => staffMember.id));
  const nextPositionByStatus: Record<TaskStatus, number> = {
    [TaskStatus.TODO]: 0,
    [TaskStatus.IN_PROGRESS]: 0,
    [TaskStatus.BLOCKED]: 0,
    [TaskStatus.DONE]: 0,
  };

  let createdTasks = 0;
  let updatedTasks = 0;

  for (const seededTask of seededTasks) {
    const eventId = eventIdByCode.get(seededTask.eventCode);
    if (!eventId) {
      throw new Error(`Missing event for task eventCode=${seededTask.eventCode}`);
    }

    if (!knownStaffIds.has(seededTask.assigneeStaffMemberId)) {
      throw new Error(
        `Missing staff member for task assignee=${seededTask.assigneeStaffMemberId}`,
      );
    }

    const existing = await prisma.task.findUnique({
      where: { id: seededTask.id },
      select: { id: true },
    });

    const position = nextPositionByStatus[seededTask.status];
    nextPositionByStatus[seededTask.status] += 1;

    const dueAt = seededTask.dueAt ? new Date(seededTask.dueAt) : null;
    const completedAt =
      seededTask.status === TaskStatus.DONE
        ? (dueAt ?? new Date("2026-01-01T00:00:00.000Z"))
        : null;

    await prisma.task.upsert({
      where: { id: seededTask.id },
      update: {
        organizationId: org.id,
        eventId,
        title: seededTask.title,
        description: seededTask.description ?? null,
        type: seededTask.type,
        status: seededTask.status,
        priority: seededTask.priority,
        labels: seededTask.labels ?? [],
        relatedLabel: null,
        position,
        imageUrl: null,
        imageKey: null,
        dueAt,
        completedAt,
        createdById: admin.id,
        assignedToStaffMemberId: seededTask.assigneeStaffMemberId,
      },
      create: {
        id: seededTask.id,
        organizationId: org.id,
        eventId,
        title: seededTask.title,
        description: seededTask.description ?? null,
        type: seededTask.type,
        status: seededTask.status,
        priority: seededTask.priority,
        labels: seededTask.labels ?? [],
        relatedLabel: null,
        position,
        imageUrl: null,
        imageKey: null,
        dueAt,
        completedAt,
        createdById: admin.id,
        assignedToStaffMemberId: seededTask.assigneeStaffMemberId,
      },
    });

    if (existing) {
      updatedTasks += 1;
    } else {
      createdTasks += 1;
    }
  }

  let createdCategories = 0;
  let updatedCategories = 0;
  const categoryIdByName = new Map<string, string>();

  for (const category of assetCategories) {
    const where = {
      organizationId_name: {
        organizationId: org.id,
        name: category.name,
      },
    } as const;

    const existing = await prisma.assetCategory.findUnique({ where, select: { id: true } });

    const row = await prisma.assetCategory.upsert({
      where,
      update: {
        description: category.description,
      },
      create: {
        organizationId: org.id,
        name: category.name,
        description: category.description,
      },
      select: { id: true },
    });

    if (existing) {
      updatedCategories += 1;
    } else {
      createdCategories += 1;
    }

    categoryIdByName.set(category.name, row.id);
  }

  let createdAssets = 0;
  let updatedAssets = 0;

  for (let index = 0; index < assets.length; index += 1) {
    const asset = assets[index];
    const categoryId = categoryIdByName.get(asset.categoryName);

    if (!categoryId) {
      throw new Error(`Missing categoryId for ${asset.categoryName}`);
    }

    const existing = await prisma.asset.findFirst({
      where: {
        organizationId: org.id,
        assetTag: asset.assetTag,
      },
      select: { id: true },
    });

    const imageEnabled = index % 5 === 0;
    const resolvedImageUrl = imageEnabled
      ? (asset.imageUrl ??
        fallbackAssetImageUrls[index % fallbackAssetImageUrls.length])
      : null;

    const baseData = {
      organizationId: org.id,
      categoryId,
      name: asset.name,
      assetTag: asset.assetTag,
      serialNumber: asset.serialNumber ?? null,
      description: asset.description ?? null,
      status: asset.status ?? AssetStatus.IN_STORAGE,
      condition: asset.condition ?? AssetCondition.GOOD,
      quantity: asset.quantity,
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : null,
      purchasePrice: asset.purchasePrice ?? null,
      supplierName: asset.supplierName ?? null,
      location: asset.location,
      notes: asset.notes ?? null,
      imageUrl: resolvedImageUrl,
      imageKey: imageEnabled ? assetImageKey(asset.assetTag) : null,
      qrImageUrl: null,
      qrImageKey: null,
    };

    if (existing) {
      await prisma.asset.update({
        where: { id: existing.id },
        data: baseData,
      });
      updatedAssets += 1;
    } else {
      await prisma.asset.create({
        data: baseData,
      });
      createdAssets += 1;
    }
  }

  const assetsByTag = await prisma.asset.findMany({
    where: {
      organizationId: org.id,
      assetTag: {
        in: assets.map((asset) => asset.assetTag),
      },
    },
    select: {
      id: true,
      assetTag: true,
      name: true,
    },
  });

  const assetByTag = new Map(
    assetsByTag
      .filter((asset) => asset.assetTag)
      .map((asset) => [asset.assetTag as string, asset]),
  );

  let createdKits = 0;
  let updatedKits = 0;

  for (const kit of kits) {
    const existing = await prisma.inventoryKit.findUnique({
      where: { id: kit.id },
      select: { id: true },
    });

    const upsertedKit = await prisma.inventoryKit.upsert({
      where: { id: kit.id },
      update: {
        organizationId: org.id,
        name: kit.name,
        description: kit.description ?? null,
        eventType: kit.eventType,
      },
      create: {
        id: kit.id,
        organizationId: org.id,
        name: kit.name,
        description: kit.description ?? null,
        eventType: kit.eventType,
      },
      select: { id: true },
    });

    if (existing) {
      updatedKits += 1;
    } else {
      createdKits += 1;
    }

    await prisma.inventoryKitItem.deleteMany({ where: { kitId: upsertedKit.id } });

    const rows = kit.items
      .map((item) => {
        if ("assetTag" in item) {
          const assetRef = assetByTag.get(item.assetTag);
          if (!assetRef) {
            throw new Error(`Missing asset for kit item assetTag=${item.assetTag}`);
          }

          return {
            kitId: upsertedKit.id,
            assetId: assetRef.id,
            categoryId: null,
            name: item.name,
            quantity: item.quantity,
          };
        }

        const categoryId = categoryIdByName.get(item.categoryName);
        if (!categoryId) {
          throw new Error(`Missing category for kit item categoryName=${item.categoryName}`);
        }

        return {
          kitId: upsertedKit.id,
          assetId: null,
          categoryId,
          name: item.name,
          quantity: item.quantity,
        };
      });

    if (rows.length > 0) {
      await prisma.inventoryKitItem.createMany({ data: rows });
    }
  }

  let createdChecklists = 0;
  let updatedChecklists = 0;

  for (const checklist of checklists) {
    const eventId = eventIdByCode.get(checklist.eventCode);
    if (!eventId) {
      throw new Error(`Missing event for checklist eventCode=${checklist.eventCode}`);
    }

    const totalItems = checklist.items.length;
    const verifiedItems = checklist.items.filter((item) => item.verified).length;
    const missingItems = checklist.items.filter(
      (item) => item.condition === InventoryChecklistItemCondition.MISSING,
    ).length;

    const existing = await prisma.inventoryChecklist.findUnique({
      where: { checklistNumber: checklist.checklistNumber },
      select: { id: true },
    });

    const row = await prisma.inventoryChecklist.upsert({
      where: { checklistNumber: checklist.checklistNumber },
      update: {
        organizationId: org.id,
        eventId,
        checklistType: checklist.checklistType,
        responsibleName: checklist.responsibleName,
        notes: checklist.notes ?? null,
        status: checklist.status,
        totalItems,
        verifiedItems,
        missingItems,
        signedBy: checklist.signedBy ?? null,
        signedAt: checklist.signedAt ? new Date(checklist.signedAt) : null,
        signatureData: null,
      },
      create: {
        organizationId: org.id,
        eventId,
        checklistNumber: checklist.checklistNumber,
        checklistType: checklist.checklistType,
        responsibleName: checklist.responsibleName,
        notes: checklist.notes ?? null,
        status: checklist.status,
        totalItems,
        verifiedItems,
        missingItems,
        signedBy: checklist.signedBy ?? null,
        signedAt: checklist.signedAt ? new Date(checklist.signedAt) : null,
        signatureData: null,
      },
      select: { id: true },
    });

    if (existing) {
      updatedChecklists += 1;
    } else {
      createdChecklists += 1;
    }

    await prisma.inventoryChecklistItem.deleteMany({ where: { checklistId: row.id } });

    const checklistRows = checklist.items.map((item) => {
      const asset = assetByTag.get(item.assetTag);
      if (!asset) {
        throw new Error(`Missing asset for checklist item assetTag=${item.assetTag}`);
      }

      return {
        checklistId: row.id,
        assetId: asset.id,
        assetName: asset.name,
        assetCodeOrTag: item.assetTag,
        quantityExpected: item.quantityExpected,
        quantityVerified: item.quantityVerified,
        verified: item.verified,
        verifiedAt: item.verified ? new Date("2026-02-15T12:00:00.000Z") : null,
        verifiedBy: item.verifiedBy ?? null,
        notes: item.notes ?? null,
        condition: item.condition,
      };
    });

    if (checklistRows.length > 0) {
      await prisma.inventoryChecklistItem.createMany({ data: checklistRows });
    }
  }

  const [
    eventsCount,
    eventsTargetCount,
    categoriesCount,
    assetsCount,
    staffMembersCount,
    staffAssignmentsCount,
    tasksCount,
  ] = await Promise.all([
    prisma.event.count({ where: { organizationId: org.id } }),
    prisma.event.count({
      where: {
        organizationId: org.id,
        code: { in: events2026.map((event) => event.code) },
      },
    }),
    prisma.assetCategory.count({ where: { organizationId: org.id } }),
    prisma.asset.count({ where: { organizationId: org.id } }),
    prisma.staffMember.count({ where: { organizationId: org.id } }),
    prisma.staffAssignment.count({ where: { staffMember: { organizationId: org.id } } }),
    prisma.task.count({ where: { organizationId: org.id } }),
  ]);

  console.log("Seed OK:", {
    organizationId: org.id,
    adminEmail,
    events: {
      target: events2026.length,
      targetEventsInOrg: eventsTargetCount,
      totalInOrg: eventsCount,
      created: createdEvents,
      updated: updatedEvents,
    },
    staffMembers: {
      target: staffMembers.length,
      totalInOrg: staffMembersCount,
      created: createdStaffMembers,
      updated: updatedStaffMembers,
    },
    staffAssignments: {
      totalInOrg: staffAssignmentsCount,
      created: createdStaffAssignments,
      updated: updatedStaffAssignments,
    },
    tasks: {
      target: seededTasks.length,
      totalInOrg: tasksCount,
      created: createdTasks,
      updated: updatedTasks,
    },
    categories: {
      target: assetCategories.length,
      totalInOrg: categoriesCount,
      created: createdCategories,
      updated: updatedCategories,
    },
    assets: {
      target: assets.length,
      totalInOrg: assetsCount,
      created: createdAssets,
      updated: updatedAssets,
      withPurchaseData: assets.filter((asset) => !!asset.purchaseDate && !!asset.purchasePrice).length,
      withImage: assets.filter((_, idx) => idx % 5 === 0).length,
    },
    kits: {
      total: kits.length,
      created: createdKits,
      updated: updatedKits,
    },
    checklists: {
      total: checklists.length,
      created: createdChecklists,
      updated: updatedChecklists,
    },
    actorUserId: admin.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
