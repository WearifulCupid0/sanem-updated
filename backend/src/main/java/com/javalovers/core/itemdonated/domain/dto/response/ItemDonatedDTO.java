package com.javalovers.core.itemdonated.domain.dto.response;

import com.javalovers.core.category.domain.dto.response.CategoryDTO;
import com.javalovers.core.item.domain.dto.response.ItemDTO;
import com.javalovers.core.itemdonated.domain.enums.ConservationState;

public record ItemDonatedDTO(
        Long itemDonatedId,
        ItemDTO item,
        Integer quantity,
        CategoryDTO category,
        ConservationState conservationState
) {
}
