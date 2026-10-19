
package com.smartmaintenance.backend.controller;

import com.smartmaintenance.backend.entity.Equipment;
import com.smartmaintenance.backend.repository.EquipmentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174"
})
public class EquipmentController {

    private final EquipmentRepository repo;

    public EquipmentController(EquipmentRepository repo) {
        this.repo = repo;
    }

    // Get all equipment
    @GetMapping
    public List<Equipment> getAll() {
        return repo.findAll();
    }

    // Get equipment by ID
    @GetMapping("/{id}")
    public Equipment getById(@PathVariable Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Equipment not found with ID: " + id
                ));
    }

    // Add new equipment
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Equipment create(@RequestBody Equipment equipment) {
        equipment.setId(null);
        return repo.save(equipment);
    }

    // Update existing equipment
    @PutMapping("/{id}")
    public Equipment update(
            @PathVariable Long id,
            @RequestBody Equipment updatedEquipment) {

        Equipment existing = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Equipment not found with ID: " + id
                ));

        existing.setName(updatedEquipment.getName());
        existing.setLocation(updatedEquipment.getLocation());
        existing.setStatus(updatedEquipment.getStatus());
        existing.setDescription(updatedEquipment.getDescription());

        return repo.save(existing);
    }

    // Delete equipment
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {

        if (!repo.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Equipment not found with ID: " + id
            );
        }

        repo.deleteById(id);
    }

    // Get equipment by status
    @GetMapping("/status/{status}")
    public List<Equipment> getByStatus(
            @PathVariable String status) {

        return repo.findByStatus(status);
    }
}
