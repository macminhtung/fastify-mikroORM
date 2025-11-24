import { AbstractNamingStrategy, NamingStrategy } from '@mikro-orm/core';

export class MikroORMNamingStrategy extends AbstractNamingStrategy implements NamingStrategy {
  classToTableName(entityName: string): string {
    return entityName; // Keeps the original table name
  }

  referenceColumnName(): string {
    return 'id'; // Standard reference column name
  }

  joinColumnName(propertyName: string): string {
    return propertyName; // Keeps the original join column name
  }

  joinKeyColumnName(entityName: string, referencedColumnName?: string): string {
    return `${entityName}_${referencedColumnName || 'id'}`; // Standard FK naming
  }

  joinTableName(sourceEntity: string, targetEntity: string): string {
    return `${sourceEntity}_${targetEntity}`; // Standard join table naming
  }

  propertyToColumnName(propertyName: string): string {
    return this.toSnakeCase(propertyName);
  }

  columnNameToProperty(columnName: string): string {
    return this.toCamelCase(columnName); // Converts to camelCase
  }

  private toCamelCase(columnName: string): string {
    return columnName
      .replace(/(\bID\b|\bid\b|\bId\b)/g, 'id')
      .replace(/_([a-zA-Z])/g, (_, g) => g.toUpperCase())
      .replace(
        /([a-z])([A-Z]+)/g,
        (match, p1, p2) => p1 + p2.charAt(0).toUpperCase() + p2.slice(1).toLowerCase(),
      )
      .replace(
        /([A-Z]+)(?=[A-Z][a-z])/g,
        (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase(),
      )
      .replace(/^[A-Z]/, (match) => match.toLowerCase());
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
      .toLowerCase();
  }
}
