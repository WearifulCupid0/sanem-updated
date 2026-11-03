package com.javalovers.core.donation.service;

import com.javalovers.common.exception.EntityNotFoundException;
import com.javalovers.core.appuser.domain.entity.AppUser;
import com.javalovers.core.category.domain.entity.Category;
import com.javalovers.core.category.service.CategoryService;
import com.javalovers.core.donation.domain.dto.request.DonationFormDTO;
import com.javalovers.core.donation.domain.dto.response.DonationDTO;
import com.javalovers.core.donation.domain.entity.Donation;
import com.javalovers.core.donation.mapper.DonationCreateMapper;
import com.javalovers.core.donation.mapper.DonationDTOMapper;
import com.javalovers.core.donation.repository.DonationRepository;
import com.javalovers.core.donation.specification.DonationSpecification;
import com.javalovers.core.donor.domain.entity.Donor;
import com.javalovers.core.inventory.domain.enums.TransactionType;
import com.javalovers.core.inventory.service.InventoryService;
import com.javalovers.core.item.domain.entity.Item;
import com.javalovers.core.item.service.ItemService;
import com.javalovers.core.itemdonated.domain.entity.ItemDonated;
import com.javalovers.core.itemdonated.repository.ItemDonatedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final DonationCreateMapper donationCreateMapper;
    private final DonationDTOMapper donationDTOMapper;
    private final ItemService itemService;
    private final ItemDonatedRepository itemDonatedRepository;
    private final InventoryService inventoryService;
    private final CategoryService categoryService;

    @Transactional
    public DonationDTO create(DonationFormDTO formDTO, Donor donor, AppUser user) {
        Donation donation = donationCreateMapper.convert(formDTO, donor, user);
        donation.setItems(new ArrayList<>());
        Donation savedDonation = donationRepository.save(donation);

        for (DonationFormDTO.DonationItemRequestDTO itemDTO : formDTO.items()) {
            if (itemDTO.quantity() == null || itemDTO.quantity() <= 0) {
                throw new IllegalArgumentException("A quantidade de cada item deve ser maior que zero.");
            }

            Category category = categoryService.getOrNull(itemDTO.categoryId());
            if (category == null || category.getDeletedAt() != null) {
                throw new EntityNotFoundException("Category", itemDTO.categoryId());
            }

            Item item;
            if (itemDTO.itemId() != null) {
                item = itemService.getOrThrowException(itemDTO.itemId());
            } else {
                if (itemDTO.newItemName() == null || itemDTO.newItemName().isBlank()) {
                    throw new IllegalArgumentException("Informe o nome do item novo.");
                }
                item = new Item();
                item.setDescription(itemDTO.newItemName().trim());
                item.setStockQuantity(0L);
                itemService.save(item);
            }

            inventoryService.processTransaction(
                    item,
                    itemDTO.quantity().longValue(),
                    TransactionType.DONATION_IN,
                    savedDonation.getDonationId()
            );

            ItemDonated donatedItem = new ItemDonated();
            donatedItem.setDonation(savedDonation);
            donatedItem.setItem(item);
            donatedItem.setQuantity(itemDTO.quantity());
            donatedItem.setCategory(category);
            donatedItem.setConservationState(itemDTO.conservationState());
            ItemDonated savedDonatedItem = itemDonatedRepository.save(donatedItem);
            savedDonation.getItems().add(savedDonatedItem);
        }

        return donationDTOMapper.convert(savedDonation);
    }

    @Transactional
    public void delete(Long id) {
        Donation donation = getOrThrowException(id);
        if (donation.getItems() != null) {
            for (ItemDonated donatedItem : donation.getItems()) {
                Item item = donatedItem.getItem();
                inventoryService.processTransaction(
                        item,
                        donatedItem.getQuantity().longValue(),
                        TransactionType.DONATION_REVERSAL,
                        donation.getDonationId()
                );
                donatedItem.softDelete();
                itemDonatedRepository.save(donatedItem);
            }
        }
        donation.softDelete();
        donationRepository.save(donation);
    }

    @Transactional(readOnly = true)
    public DonationDTO findById(Long id) {
        return donationRepository.findById(id)
                .filter(donation -> donation.getDeletedAt() == null)
                .map(donationDTOMapper::convert)
                .orElseThrow(() -> new EntityNotFoundException("Donation", id));
    }

    @Transactional(readOnly = true)
    public List<DonationDTO> findAll() {
        return donationRepository.findAll().stream()
                .filter(donation -> donation.getDeletedAt() == null)
                .map(donationDTOMapper::convert)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DonationDTO> findAllFiltered(
            Date startDate,
            Date endDate,
            String donorName,
            String attendantName,
            String itemName
    ) {
        if (startDate != null && endDate != null && startDate.after(endDate)) {
            throw new IllegalArgumentException("A data inicial não pode ser posterior à data final.");
        }

        Specification<Donation> specification = Specification.where(DonationSpecification.isNotDeleted())
                .and(DonationSpecification.betweenDates(startDate, endDate))
                .and(DonationSpecification.hasDonorName(donorName))
                .and(DonationSpecification.hasAttendantName(attendantName))
                .and(DonationSpecification.hasItemName(itemName));

        return donationRepository.findAll(specification).stream()
                .distinct()
                .map(donationDTOMapper::convert)
                .collect(Collectors.toList());
    }

    public Donation getOrThrowException(Long id) {
        return donationRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("Donation", id)
        );
    }
}
