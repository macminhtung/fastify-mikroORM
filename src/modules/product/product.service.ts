import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { BaseService } from '@/common/base.service';
import { GetPaginatedRecordsDto, PaginatedResponseDto } from '@/common/dtos';
import { ProductEntity } from '@/modules/product/product.entity';
import { SearchProductService } from '@/modules/elastic/search-services';
import { CreateProductDto } from '@/modules/product/dtos';

@Injectable()
export class ProductService extends BaseService<ProductEntity> {
  constructor(
    @InjectRepository(ProductEntity)
    public readonly repository: EntityRepository<ProductEntity>,

    private readonly searchProductService: SearchProductService,
  ) {
    super(repository);
  }

  // #========================#
  // # ==> CREATE PRODUCT <== #
  // #========================#
  async createProduct(payload: CreateProductDto): Promise<ProductEntity> {
    // Check conflict the product name
    await this.checkConflict({ filter: { name: payload.name } });

    // Start transaction
    const txManager = this.entityManager.fork();
    const resData = await this.handleTransactionAndRelease(
      txManager,

      // Process function
      async () => {
        // Identify the transaction repository
        const txRepository = txManager.getRepository(ProductEntity);

        // Create new product
        const newProduct = await this.create({ entityData: payload, txRepository });

        // Create index for the new product
        await this.searchProductService.index(newProduct);

        return newProduct;
      },
    );

    return resData;
  }

  // #========================#
  // # ==> UPDATE PRODUCT <== #
  // #========================#
  async updateProduct(id: string, payload: CreateProductDto): Promise<ProductEntity> {
    // Check the product already exists
    const existedProduct = await this.checkExist({ filter: { id } });

    // Check conflict the product name
    await this.checkConflict({ filter: { name: payload.name, id: { $ne: id } } });

    // Start transaction
    const txManager = this.entityManager.fork();
    await this.handleTransactionAndRelease(
      txManager,

      // Process function
      async () => {
        // Identify the transaction repository
        const txRepository = txManager.getRepository(ProductEntity);

        // Update product
        await this.update({ filter: { id }, entityData: payload, txRepository });

        // Update index for the new product
        await this.searchProductService.index({ id, ...payload });
      },
    );

    return { ...existedProduct, ...payload };
  }

  // #========================#
  // # ==> DELETE PRODUCT <== #
  // #========================#
  async deleteProduct(id: string): Promise<string> {
    // Check the product already exists
    await this.checkExist({ filter: { id } });

    // Start transaction
    const txManager = this.entityManager.fork();
    await this.handleTransactionAndRelease(
      txManager,

      // Process function
      async () => {
        // Identify the transaction repository
        const txRepository = txManager.getRepository(ProductEntity);

        // Delete product
        await this.delete({ filter: { id }, txRepository });

        // Delete index for the product
        await this.searchProductService.delete(id);
      },
    );

    return id;
  }

  // #================================#
  // # ==> GET PAGINATED PRODUCTS <== #
  // #================================#
  async getPaginatedProducts(
    queryParams: GetPaginatedRecordsDto,
  ): Promise<PaginatedResponseDto<ProductEntity>> {
    const { keySearch, ...restParams } = queryParams;
    let productIds: string[] = [];

    // Search based on keySearch
    if (keySearch) {
      const items = await this.searchProductService.search(keySearch);
      productIds = items.map((i) => i.id!);
    }

    const paginationData = await this.getPaginatedRecords(restParams, (qb) => {
      // Filter based on productIds [ElasticSearch]
      if (productIds.length) {
        qb.andWhere({ id: { $in: productIds } });
      }

      // Filter based on keySearch
      else if (keySearch) qb.andWhere({ name: { $ilike: `%${keySearch}%` } });
    });

    return paginationData;
  }
}
