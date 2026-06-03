package com.conex.securitymonitor.event;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findAllByOrderByOccurredAtDesc(Pageable pageable);

    @Query("SELECT COUNT(e) FROM Event e WHERE e.eventType = :type AND e.ip = :ip AND e.occurredAt >= :since")
    long countByTypeAndIpSince(@Param("type") EventType type,
                               @Param("ip") String ip,
                               @Param("since") Instant since);

    long countByEventType(EventType eventType);

    @Query("SELECT COUNT(e) FROM Event e WHERE e.eventType = :type AND e.occurredAt >= :since")
    long countByTypeSince(@Param("type") EventType type, @Param("since") Instant since);
}
