# API

## Table of contents

### Functions

- [VList](API.md#vlist)
- [WVList](API.md#wvlist)
- [experimental\_VGrid](API.md#experimental_vgrid)

### Interfaces

- [CacheSnapshot](interfaces/CacheSnapshot.md)
- [ScrollToIndexOpts](interfaces/ScrollToIndexOpts.md)
- [VListProps](interfaces/VListProps.md)
- [VListHandle](interfaces/VListHandle.md)
- [WVListProps](interfaces/WVListProps.md)
- [WVListHandle](interfaces/WVListHandle.md)
- [VGridProps](interfaces/VGridProps.md)
- [VGridHandle](interfaces/VGridHandle.md)
- [CustomCellComponentProps](interfaces/CustomCellComponentProps.md)
- [CustomViewportComponentProps](interfaces/CustomViewportComponentProps.md)
- [CustomItemComponentProps](interfaces/CustomItemComponentProps.md)

### Type Aliases

- [ScrollToIndexAlign](API.md#scrolltoindexalign)
- [CustomCellComponent](API.md#customcellcomponent)
- [ViewportComponentAttributes](API.md#viewportcomponentattributes)
- [CustomViewportComponent](API.md#customviewportcomponent)
- [CustomItemComponent](API.md#customitemcomponent)

## Functions

### VList

▸ **VList**(`props`): `ReactNode`

Virtualized list component. See [VListProps](interfaces/VListProps.md) and [VListHandle](interfaces/VListHandle.md).

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`VListProps`](interfaces/VListProps.md) & `RefAttributes`\<[`VListHandle`](interfaces/VListHandle.md)\> |

#### Returns

`ReactNode`

#### Defined in

node_modules/@types/react/index.d.ts:395

___

### WVList

▸ **WVList**(`props`): `ReactNode`

Virtualized list component controlled by the window scrolling. See [WVListProps](interfaces/WVListProps.md) and [WVListHandle](interfaces/WVListHandle.md).

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`WVListProps`](interfaces/WVListProps.md) & `RefAttributes`\<[`WVListHandle`](interfaces/WVListHandle.md)\> |

#### Returns

`ReactNode`

#### Defined in

node_modules/@types/react/index.d.ts:395

___

### experimental\_VGrid

▸ **experimental_VGrid**(`props`): `ReactNode`

Virtualized grid component. See [VGridProps](interfaces/VGridProps.md) and [VGridHandle](interfaces/VGridHandle.md).

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`VGridProps`](interfaces/VGridProps.md) & `RefAttributes`\<[`VGridHandle`](interfaces/VGridHandle.md)\> |

#### Returns

`ReactNode`

#### Defined in

node_modules/@types/react/index.d.ts:395

## Type Aliases

### ScrollToIndexAlign

Ƭ **ScrollToIndexAlign**: ``"start"`` \| ``"center"`` \| ``"end"`` \| ``"nearest"``

#### Defined in

[src/core/types.ts:25](https://github.com/inokawa/virtua/blob/f410388f/src/core/types.ts#L25)

___

### CustomCellComponent

Ƭ **CustomCellComponent**: `React.ForwardRefExoticComponent`\<`React.PropsWithoutRef`\<[`CustomCellComponentProps`](interfaces/CustomCellComponentProps.md)\> & `React.RefAttributes`\<`any`\>\>

#### Defined in

[src/react/VGrid.tsx:49](https://github.com/inokawa/virtua/blob/f410388f/src/react/VGrid.tsx#L49)

___

### ViewportComponentAttributes

Ƭ **ViewportComponentAttributes**: `Pick`\<`React.HTMLAttributes`\<`HTMLElement`\>, ``"className"`` \| ``"style"`` \| ``"id"`` \| ``"role"`` \| ``"tabIndex"`` \| ``"onKeyDown"``\> & `React.AriaAttributes`

#### Defined in

[src/react/Viewport.tsx:9](https://github.com/inokawa/virtua/blob/f410388f/src/react/Viewport.tsx#L9)

___

### CustomViewportComponent

Ƭ **CustomViewportComponent**: typeof `Viewport`

#### Defined in

[src/react/Viewport.tsx:63](https://github.com/inokawa/virtua/blob/f410388f/src/react/Viewport.tsx#L63)

___

### CustomItemComponent

Ƭ **CustomItemComponent**: `React.ForwardRefExoticComponent`\<`React.PropsWithoutRef`\<[`CustomItemComponentProps`](interfaces/CustomItemComponentProps.md)\> & `React.RefAttributes`\<`any`\>\>

#### Defined in

[src/react/ListItem.tsx:23](https://github.com/inokawa/virtua/blob/f410388f/src/react/ListItem.tsx#L23)
