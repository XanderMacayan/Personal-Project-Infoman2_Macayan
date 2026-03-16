export const COLLEGES = [
  "College of Engineering and Architecture",
  "College of Arts and Sciences",
  "College of Business Administration",
  "College of Computer Studies",
  "College of Education",
  "College of Nursing",
  "Graduate School",
  "Senior High School",
  "Library Staff",
  "Administration Office"
];

export const PURPOSES = [
  "Reading Books",
  "Research in Thesis",
  "Use of Computer",
  "Doing Assignments",
  "Group Discussion",
  "Return/Borrow Books"
];

export interface LibraryVisitor {
  id: string;
  name: string;
  college: string;
  email: string;
  isEmployee: boolean;
  rfid?: string;
  isBlocked?: boolean;
}

export const MOCK_USERS: LibraryVisitor[] = [
  {
    id: "v1",
    name: "John Carlo Esperanza",
    college: "College of Computer Studies",
    email: "jcesperanza@neu.edu.ph",
    isEmployee: false,
    rfid: "RFID-12345"
  },
  {
    id: "v2",
    name: "Admin User",
    college: "Library Administration",
    email: "admin@neu.edu.ph",
    isEmployee: true,
    rfid: "RFID-00001"
  },
  {
    id: "v3",
    name: "Sarah Miller",
    college: "College of Arts and Sciences",
    email: "smiller@neu.edu.ph",
    isEmployee: false,
    rfid: "RFID-54321"
  },
  {
    id: "v4",
    name: "Prof. David Clark",
    college: "College of Engineering and Architecture",
    email: "dclark@neu.edu.ph",
    isEmployee: true,
    rfid: "RFID-98765"
  }
];

export interface VisitorLogEntry {
  id: string;
  visitorId: string;
  visitorName: string;
  college: string;
  date: string;
  time: string;
  purpose: string;
  isEmployee: boolean;
}