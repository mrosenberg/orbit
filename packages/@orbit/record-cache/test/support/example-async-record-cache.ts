/* eslint-disable valid-jsdoc */
import { clone, deepGet, deepSet, Dict, objectValues } from '@orbit/utils';
import {
  Record,
  RecordIdentity,
  equalRecordIdentities
} from '@orbit/data';
import {
  RecordRelationshipIdentity,
  AsyncRecordCache,
  AsyncRecordCacheSettings
} from '../../src/index';

/**
 * A minimal implementation of `AsyncRecordCache`.
 */
export default class ExampleAsyncRecordCache extends AsyncRecordCache {
  protected _records: Dict<Dict<Record>>;
  protected _inverseRelationships: Dict<Dict<RecordRelationshipIdentity[]>>;

  constructor(settings: AsyncRecordCacheSettings) {
    super(settings);

    this._records = {};
    this._inverseRelationships = {}

    Object.keys(this._schema.models).forEach(type => {
      this._records[type] = {};
      this._inverseRelationships[type] = {};
    });
  }

  async getRecordAsync(identity: RecordIdentity): Promise<Record | null> {
    return deepGet(this._records, [identity.type, identity.id]) || null;
  }

  async getRecordsAsync(type: string): Promise<Record[]> {
    return objectValues(this._records[type]);
  }

  async setRecordAsync(record: Record): Promise<void> {
    deepSet(this._records, [record.type, record.id], record);
  }

  async setRecordsAsync(records: Record[]): Promise<void> {
    for (let record of records) {
      deepSet(this._records, [record.type, record.id], record);
    }
  }

  async removeRecordAsync(recordIdentity: RecordIdentity): Promise<Record | null> {
    const record = await this.getRecordAsync(recordIdentity);
    if (record) {
      delete this._records[recordIdentity.type][recordIdentity.id];
      return record;
    } else {
      return null;
    }
  }

  async removeRecordsAsync(recordIdentities: RecordIdentity[]): Promise<Record[]> {
    const records = [];
    for (let recordIdentity of recordIdentities) {
      let record = await this.getRecordAsync(recordIdentity);
      if (record) {
        records.push(record);
        delete this._records[recordIdentity.type][recordIdentity.id];
      }
    }
    return records;
  }

  async getInverseRelationshipsAsync(recordIdentity: RecordIdentity): Promise<RecordRelationshipIdentity[]> {
    return deepGet(this._inverseRelationships, [recordIdentity.type, recordIdentity.id]) || [];
  }

  async addInverseRelationshipsAsync(relationships: RecordRelationshipIdentity[]): Promise<void> {
    for (let relationship of relationships) {
      let rels = deepGet(this._inverseRelationships, [relationship.relatedRecord.type, relationship.relatedRecord.id]);
      rels = rels ? clone(rels) : [];
      rels.push(relationship);
      deepSet(this._inverseRelationships, [relationship.relatedRecord.type, relationship.relatedRecord.id], rels);
    }
  }

  async removeInverseRelationshipsAsync(relationships: RecordRelationshipIdentity[]): Promise<void> {
    for (let relationship of relationships) {
      let rels = deepGet(this._inverseRelationships, [relationship.relatedRecord.type, relationship.relatedRecord.id]);
      if (rels) {
        let newRels = rels.filter(rel => !(equalRecordIdentities(rel.record, relationship.record) &&
                                           rel.relationship === relationship.relationship));
        deepSet(this._inverseRelationships, [relationship.relatedRecord.type, relationship.relatedRecord.id], newRels);
      }
    }
  }
}
