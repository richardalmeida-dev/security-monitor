package com.conex.securitymonitor.alerting;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("""
            SELECT a FROM Alert a
            WHERE a.alertType = :type
              AND a.ip = :ip
              AND a.windowEnd >= :now
            ORDER BY a.createdAt DESC
            """)
    Optional<Alert> findActiveAlert(@Param("type") AlertType type,
                                    @Param("ip") String ip,
                                    @Param("now") Instant now);
}
