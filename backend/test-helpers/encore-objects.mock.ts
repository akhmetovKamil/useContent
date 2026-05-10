interface ObjectAttrs {
  contentType?: string;
}

export class Bucket {
  private readonly objects = new Map<string, { body: Buffer; attrs: ObjectAttrs }>();

  constructor(
    public readonly name: string,
    public readonly options?: unknown,
  ) {}

  async upload(key: string, body: Buffer, attrs: ObjectAttrs = {}): Promise<void> {
    this.objects.set(key, { body, attrs });
  }

  async download(key: string): Promise<Buffer> {
    const object = this.objects.get(key);
    if (!object) {
      throw Object.assign(new Error("object not found"), {
        code: "object_not_found",
        name: "ObjectNotFound",
      });
    }
    return object.body;
  }

  async attrs(key: string): Promise<ObjectAttrs> {
    const object = this.objects.get(key);
    if (!object) {
      throw Object.assign(new Error("object not found"), {
        code: "object_not_found",
        name: "ObjectNotFound",
      });
    }
    return object.attrs;
  }

  async remove(key: string): Promise<void> {
    if (!this.objects.delete(key)) {
      throw Object.assign(new Error("object not found"), {
        code: "object_not_found",
        name: "ObjectNotFound",
      });
    }
  }
}
