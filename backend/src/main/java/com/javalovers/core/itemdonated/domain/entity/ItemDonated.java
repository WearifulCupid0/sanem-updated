package com.javalovers.core.itemdonated.domain.entity;

import com.javalovers.common.entity.SoftDeletable;
import com.javalovers.core.category.domain.entity.Category;
import com.javalovers.core.donation.domain.entity.Donation;
import com.javalovers.core.item.domain.entity.Item;
import com.javalovers.core.itemdonated.domain.enums.ConservationState;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "item_donated")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ItemDonated implements SoftDeletable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_donated_id")
    private Long itemDonatedId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donation_id", nullable = false)
    private Donation donation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @NotNull
    @Min(1)
    @Column(nullable = false)
    private Integer quantity;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "conservation_state", length = 16, nullable = false)
    private ConservationState conservationState = ConservationState.GOOD;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
