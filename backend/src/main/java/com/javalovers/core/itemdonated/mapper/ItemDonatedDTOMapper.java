package com.javalovers.core.itemdonated.mapper;

import com.javalovers.core.category.mapper.CategoryDTOMapper;
import com.javalovers.core.item.mapper.ItemDTOMapper;
import com.javalovers.core.itemdonated.domain.dto.response.ItemDonatedDTO;
import com.javalovers.core.itemdonated.domain.entity.ItemDonated;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ItemDonatedDTOMapper {

    private final ItemDTOMapper itemDTOMapper;
    private final CategoryDTOMapper categoryDTOMapper;

    public ItemDonatedDTO convert(ItemDonated itemDonated) {
        if (itemDonated == null) return null;

        return new ItemDonatedDTO(
                itemDonated.getItemDonatedId(),
                itemDTOMapper.convert(itemDonated.getItem()),
                itemDonated.getQuantity(),
                categoryDTOMapper.convert(itemDonated.getCategory()),
                itemDonated.getConservationState()
        );
    }
}
