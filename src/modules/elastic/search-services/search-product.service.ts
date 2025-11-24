import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ETableName } from '@/common/enums';
import { ProductEntity } from '@/modules/product/product.entity';

type TProductDocument = Pick<ProductEntity, 'id' | 'name' | 'description'>;

@Injectable()
export class SearchProductService {
  constructor(private readonly service: ElasticsearchService) {}

  private readonly indexName = ETableName.PRODUCT;

  // #==========================#
  // # ==> INITIALIZE INDEX <== #
  // #==========================#
  async onModuleInit() {
    const indexExists = await this.service.indices.exists({ index: this.indexName });
    // if (indexExists) await this.service.indices.delete({ index: this.indexName });

    if (!indexExists)
      await this.service.indices.create({
        index: this.indexName,
        settings: {
          analysis: {
            analyzer: {
              product_analyzer: {
                type: 'custom',
                filter: ['lowercase'],
                tokenizer: 'product_tokenizer',
              },
            },
            tokenizer: {
              product_tokenizer: {
                type: 'edge_ngram',
                min_gram: 2,
                max_gram: 20,
                token_chars: ['letter', 'digit', 'symbol'],
              },
            },
          },
        },
        mappings: {
          properties: {
            name: {
              type: 'text',
              analyzer: 'product_analyzer',
              search_analyzer: 'product_analyzer',
            },
            description: {
              type: 'text',
              analyzer: 'product_analyzer',
              search_analyzer: 'product_analyzer',
            },
          },
        },
      });
  }

  // #===============#
  // # ==> INDEX <== #
  // #===============#
  async index(productDoc: TProductDocument) {
    const { id, name, description } = productDoc;

    return await this.service.index({
      index: this.indexName,
      id,
      document: { name, description },
    });
  }

  // #================#
  // # ==> DELETE <== #
  // #================#
  async delete(id: string) {
    return await this.service.delete({ index: this.indexName, id });
  }

  // #================#
  // # ==> SEARCH <== #
  // #================#
  async search(keySearch: string) {
    const { hits } = await this.service.search<TProductDocument>({
      index: this.indexName,
      query: { multi_match: { query: keySearch, fields: ['name', 'description'] } },
    });

    return hits.hits.map((hit) => ({ id: hit._id, ...hit._source }));
  }
}
