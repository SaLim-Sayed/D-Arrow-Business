declare module "xmldom" {
  export interface XmlDomElement {
    [key: string]: unknown;
  }
  export interface XmlDomDocument {
    documentElement: XmlDomElement;
    [key: string]: unknown;
  }
  export class DOMParser {
    parseFromString(source: string, mimeType?: string): XmlDomDocument;
  }
  export class XMLSerializer {
    serializeToString(node: XmlDomElement | XmlDomDocument): string;
  }
}
