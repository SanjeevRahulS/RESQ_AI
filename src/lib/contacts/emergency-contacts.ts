/**
 * Real emergency phone numbers shown on the public /emergency page.
 *
 * Every number here was checked against an official source listed in
 * EMERGENCY_CONTACT_SOURCES. Keep the display number and the dialled number
 * (tel) in step: `tel` is the display number with spaces removed.
 */

export type EmergencyContact = {
  /** Who answers the call. */
  name: string;
  /** Number as it should appear on screen. */
  number: string;
  /** Digits dialled by the tap-to-call link. */
  tel: string;
  /** What the service is for, in plain language. */
  service: string;
  /** Optional extra line, e.g. alternate control-room numbers. */
  note?: string;
};

export type EmergencyContactGroup = {
  id: string;
  title: string;
  note?: string;
  contacts: EmergencyContact[];
};

export const EMERGENCY_CONTACT_GROUPS: EmergencyContactGroup[] = [
  {
    id: "immediate",
    title: "Immediate emergency",
    note: "Not sure who to call? Dial 112. It reaches police, fire and ambulance from one call.",
    contacts: [
      {
        name: "Emergency Response Support System",
        number: "112",
        tel: "112",
        service: "Police, fire and ambulance from one number",
      },
      {
        name: "Ambulance, Tamil Nadu",
        number: "108",
        tel: "108",
        service: "Free emergency ambulance to your location",
      },
      {
        name: "Fire and rescue",
        number: "101",
        tel: "101",
        service: "Fire, building collapse and rescue calls",
      },
      {
        name: "Police control room",
        number: "100",
        tel: "100",
        service: "Police control room in Tamil Nadu",
      },
      {
        name: "National Ambulance Service",
        number: "102",
        tel: "102",
        service: "Ambulance when 108 is not reachable",
      },
    ],
  },
  {
    id: "chennai",
    title: "Flood and civic help in Chennai",
    note: "Use these for waterlogging, fallen trees, damaged structures and rain rescue.",
    contacts: [
      {
        name: "Greater Chennai Corporation",
        number: "1913",
        tel: "1913",
        service: "Rain, flood and civic complaints, and rescue requests",
      },
      {
        name: "Chennai Corporation control room",
        number: "044 2561 9204",
        tel: "04425619204",
        service: "Round-the-clock control room for rain and flood rescue",
        note: "Alternate lines: 044 2561 9206 and 044 2561 9207",
      },
      {
        name: "Disaster helpline",
        number: "1077",
        tel: "1077",
        service: "Disaster help listed for Chennai district",
      },
    ],
  },
  {
    id: "safety",
    title: "Women, children and coastal safety",
    contacts: [
      {
        name: "Women helpline",
        number: "1091",
        tel: "1091",
        service: "Help for women in distress",
      },
      {
        name: "Women helpline, domestic abuse",
        number: "181",
        tel: "181",
        service: "Support for domestic violence, any hour",
      },
      {
        name: "Child helpline",
        number: "1098",
        tel: "1098",
        service: "Help and protection for children",
      },
      {
        name: "Coastal security helpline",
        number: "1093",
        tel: "1093",
        service: "Help for people in danger at sea",
      },
    ],
  },
  {
    id: "other",
    title: "Other help lines",
    contacts: [
      {
        name: "Cyber crime helpline",
        number: "1930",
        tel: "1930",
        service: "Report online fraud and financial cyber crime",
      },
      {
        name: "Road accident emergency service",
        number: "1073",
        tel: "1073",
        service: "Emergency help after a road accident",
      },
      {
        name: "LPG leak helpline",
        number: "1906",
        tel: "1906",
        service: "Report a gas leak",
      },
      {
        name: "Gas helpline, Chennai",
        number: "1716",
        tel: "1716",
        service: "Gas supply and leak help in Chennai",
      },
      {
        name: "Railway helpline",
        number: "139",
        tel: "139",
        service: "Railway security and medical assistance",
      },
    ],
  },
];

/** Where each number was checked. Shown at the foot of the page. */
export const EMERGENCY_CONTACT_SOURCES = [
  {
    label: "National Portal of India helpline directory",
    href: "https://www.india.gov.in/directory/helpline",
  },
  {
    label: "Tamil Nadu Police citizen portal helplines",
    href: "https://www.police.tn.gov.in/citizenportal/pages/helpline",
  },
  {
    label: "Chennai district helpline list",
    href: "https://chennai.nic.in/helpline/",
  },
  {
    label: "Greater Chennai Corporation",
    href: "https://chennaicorporation.gov.in/",
  },
] as const;

/** When the numbers were last checked against the sources above. */
export const EMERGENCY_CONTACTS_CHECKED_ON = "November 2026";

export function allEmergencyContacts(): EmergencyContact[] {
  return EMERGENCY_CONTACT_GROUPS.flatMap((group) => group.contacts);
}
