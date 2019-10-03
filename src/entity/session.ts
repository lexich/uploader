import { ISession } from "connect-typeorm";
import { Entity, Index, Column, PrimaryColumn } from "typeorm";
import { Bigint } from "typeorm-static";


@Entity()
export class Session implements ISession {
  @Index()
  @Column("bigint", { transformer: Bigint })
  public expiredAt = Date.now();

  @PrimaryColumn("varchar", { length: 255 })
  public id = "";

  @Column("text")
  public json = "";
}
