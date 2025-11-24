import { Controller, Post, Put, Delete, Get, Param, Query, Body } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { ETableName, ERoleName } from '@/common/enums';
import { Roles } from '@/decorators';
import { Public } from '@/decorators';
import { ProductService } from '@/modules/product/product.service';
import { ProductEntity } from '@/modules/product/product.entity';
import { CreateProductDto } from '@/modules/product/dtos';
import {
  ApiOkResponsePaginated,
  GetPaginatedRecordsDto,
  PaginatedResponseDto,
} from '@/common/dtos';

@Controller(ETableName.PRODUCT)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // #========================#
  // # ==> CREATE PRODUCT <== #
  // #========================#
  @Roles([ERoleName.ADMIN])
  @ApiOkResponse({ type: ProductEntity })
  @Post()
  createProduct(@Body() payload: CreateProductDto): Promise<ProductEntity> {
    return this.productService.createProduct(payload);
  }

  // #========================#
  // # ==> UPDATE PRODUCT <== #
  // #========================#
  @Roles([ERoleName.ADMIN])
  @ApiOkResponse({ type: ProductEntity })
  @Put(':id')
  updateProduct(
    @Param('id') id: string,
    @Body() payload: CreateProductDto,
  ): Promise<ProductEntity> {
    return this.productService.updateProduct(id, payload);
  }

  // #========================#
  // # ==> DELETE PRODUCT <== #
  // #========================#
  @Roles([ERoleName.ADMIN])
  @ApiOkResponse({ type: String })
  @Delete(':id')
  deleteProduct(@Param('id') id: string): Promise<string> {
    return this.productService.deleteProduct(id);
  }

  // #================================#
  // # ==> GET PAGINATED PRODUCTS <== #
  // #================================#
  @Public()
  @ApiOkResponsePaginated(ProductEntity)
  @Get('/paginated')
  getPaginatedProducts(
    @Query() queryParams: GetPaginatedRecordsDto,
  ): Promise<PaginatedResponseDto<ProductEntity>> {
    return this.productService.getPaginatedProducts(queryParams);
  }
}
