interface StoredZipFile {
  body: Buffer;
  path: string;
}

const crcTable = buildCrcTable();

export function createStoredZipBuffer(files: StoredZipFile[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const normalizedPath = normalizeZipPath(file.path);
    if (!normalizedPath) {
      continue;
    }

    const nameBytes = Buffer.from(normalizedPath, "utf8");
    const crc = crc32(file.body);
    const localHeader = createLocalFileHeader(nameBytes, file.body, crc);
    const centralHeader = createCentralDirectoryHeader(
      nameBytes,
      file.body,
      crc,
      offset,
    );

    localParts.push(localHeader, file.body);
    centralParts.push(centralHeader);
    offset += localHeader.byteLength + file.body.byteLength;
  }

  const centralDirectorySize = centralParts.reduce(
    (sum, part) => sum + part.byteLength,
    0,
  );
  const endRecord = createEndOfCentralDirectoryRecord(
    centralParts.length,
    centralDirectorySize,
    offset,
  );

  return Buffer.concat([...localParts, ...centralParts, endRecord]);
}

function normalizeZipPath(path: string): string {
  return path
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}

function createLocalFileHeader(
  nameBytes: Buffer,
  data: Buffer,
  crc: number,
): Buffer {
  const header = Buffer.alloc(30 + nameBytes.byteLength);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(data.byteLength, 18);
  header.writeUInt32LE(data.byteLength, 22);
  header.writeUInt16LE(nameBytes.byteLength, 26);
  nameBytes.copy(header, 30);
  return header;
}

function createCentralDirectoryHeader(
  nameBytes: Buffer,
  data: Buffer,
  crc: number,
  localHeaderOffset: number,
): Buffer {
  const header = Buffer.alloc(46 + nameBytes.byteLength);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x0800, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt16LE(0, 14);
  header.writeUInt32LE(crc, 16);
  header.writeUInt32LE(data.byteLength, 20);
  header.writeUInt32LE(data.byteLength, 24);
  header.writeUInt16LE(nameBytes.byteLength, 28);
  header.writeUInt32LE(localHeaderOffset, 42);
  nameBytes.copy(header, 46);
  return header;
}

function createEndOfCentralDirectoryRecord(
  fileCount: number,
  centralDirectorySize: number,
  centralDirectoryOffset: number,
): Buffer {
  const record = Buffer.alloc(22);
  record.writeUInt32LE(0x06054b50, 0);
  record.writeUInt16LE(fileCount, 8);
  record.writeUInt16LE(fileCount, 10);
  record.writeUInt32LE(centralDirectorySize, 12);
  record.writeUInt32LE(centralDirectoryOffset, 16);
  return record;
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}
