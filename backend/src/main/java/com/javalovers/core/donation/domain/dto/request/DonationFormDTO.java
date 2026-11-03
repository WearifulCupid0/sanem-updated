package com.javalovers.core.donation.domain.dto.request;

import com.javalovers.core.itemdonated.domain.enums.ConservationState;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Date;
import java.util.List;

public record DonationFormDTO(
        @NotNull(message = "A data da doação é obrigatória")
        Date donationDate,
        // Mantido para compatibilidade com clientes antigos. O backend sempre usa o usuário autenticado.
        Long attendantUserId,
        @NotNull(message = "O doador é obrigatório")
        Long donorId,
        @NotEmpty(message = "A doação deve conter pelo menos um item")
        List<@Valid DonationItemRequestDTO> items
) {
    public record DonationItemRequestDTO(
            Long itemId,
            @Min(value = 1, message = "A quantidade deve ser maior que zero")
            @NotNull(message = "A quantidade é obrigatória")
            Integer quantity,
            String newItemName,
            @NotNull(message = "A categoria do item é obrigatória")
            Long categoryId,
            @NotNull(message = "O estado de conservação é obrigatório")
            ConservationState conservationState
    ) {}
}
