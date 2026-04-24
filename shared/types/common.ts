export type Maybe<T> = T | null;

export type NullableDateString = Maybe<string>;

export type EntityId = string;

export type WalletAddress = string;

export type TxHash = string;

export interface BaseEntityDto {
  id: EntityId;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorOwnedDto {
  authorId: EntityId;
}

export interface StorageSizedDto {
  size: number;
}

export interface ContentBaseDto extends BaseEntityDto, AuthorOwnedDto {
  title: string;
  status: "draft" | "published" | "archived";
  publishedAt: NullableDateString;
}

export interface OnChainPaymentBaseDto extends BaseEntityDto {
  chainId: number;
  tokenAddress: WalletAddress;
  contractAddress: WalletAddress;
  amount: string;
  txHash: Maybe<TxHash>;
}

export interface CursorPaginationInput {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: Maybe<string>;
  hasMore: boolean;
}
