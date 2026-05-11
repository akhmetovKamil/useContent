interface ZipFileInput {
    blob: Blob
    path: string
}

const textEncoder = new TextEncoder()
const crcTable = buildCrcTable()

export async function createStoredZip(files: ZipFileInput[]) {
    const localParts: Uint8Array[] = []
    const centralParts: Uint8Array[] = []
    let offset = 0

    for (const file of files) {
        const normalizedPath = normalizeZipPath(file.path)
        if (!normalizedPath) {
            continue
        }

        const nameBytes = textEncoder.encode(normalizedPath)
        const data = new Uint8Array(await file.blob.arrayBuffer())
        const crc = crc32(data)
        const localHeader = createLocalFileHeader(nameBytes, data, crc)
        const centralHeader = createCentralDirectoryHeader(nameBytes, data, crc, offset)

        localParts.push(localHeader, data)
        centralParts.push(centralHeader)
        offset += localHeader.byteLength + data.byteLength
    }

    const centralDirectorySize = centralParts.reduce((sum, part) => sum + part.byteLength, 0)
    const endRecord = createEndOfCentralDirectoryRecord(
        centralParts.length,
        centralDirectorySize,
        offset
    )

    return new Blob([...localParts, ...centralParts, endRecord].map(toBlobPart), {
        type: "application/zip",
    })
}

function toBlobPart(bytes: Uint8Array) {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function normalizeZipPath(path: string) {
    return path
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)
        .join("/")
}

function createLocalFileHeader(nameBytes: Uint8Array, data: Uint8Array, crc: number) {
    const header = new Uint8Array(30 + nameBytes.byteLength)
    const view = new DataView(header.buffer)
    view.setUint32(0, 0x04034b50, true)
    view.setUint16(4, 20, true)
    view.setUint16(6, 0x0800, true)
    view.setUint16(8, 0, true)
    view.setUint16(10, 0, true)
    view.setUint16(12, 0, true)
    view.setUint32(14, crc, true)
    view.setUint32(18, data.byteLength, true)
    view.setUint32(22, data.byteLength, true)
    view.setUint16(26, nameBytes.byteLength, true)
    header.set(nameBytes, 30)
    return header
}

function createCentralDirectoryHeader(
    nameBytes: Uint8Array,
    data: Uint8Array,
    crc: number,
    localHeaderOffset: number
) {
    const header = new Uint8Array(46 + nameBytes.byteLength)
    const view = new DataView(header.buffer)
    view.setUint32(0, 0x02014b50, true)
    view.setUint16(4, 20, true)
    view.setUint16(6, 20, true)
    view.setUint16(8, 0x0800, true)
    view.setUint16(10, 0, true)
    view.setUint16(12, 0, true)
    view.setUint16(14, 0, true)
    view.setUint32(16, crc, true)
    view.setUint32(20, data.byteLength, true)
    view.setUint32(24, data.byteLength, true)
    view.setUint16(28, nameBytes.byteLength, true)
    view.setUint32(42, localHeaderOffset, true)
    header.set(nameBytes, 46)
    return header
}

function createEndOfCentralDirectoryRecord(
    fileCount: number,
    centralDirectorySize: number,
    centralDirectoryOffset: number
) {
    const record = new Uint8Array(22)
    const view = new DataView(record.buffer)
    view.setUint32(0, 0x06054b50, true)
    view.setUint16(8, fileCount, true)
    view.setUint16(10, fileCount, true)
    view.setUint32(12, centralDirectorySize, true)
    view.setUint32(16, centralDirectoryOffset, true)
    return record
}

function crc32(data: Uint8Array) {
    let crc = 0xffffffff
    for (const byte of data) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff]
    }
    return (crc ^ 0xffffffff) >>> 0
}

function buildCrcTable() {
    const table = new Uint32Array(256)
    for (let index = 0; index < 256; index += 1) {
        let value = index
        for (let bit = 0; bit < 8; bit += 1) {
            value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
        }
        table[index] = value >>> 0
    }
    return table
}
