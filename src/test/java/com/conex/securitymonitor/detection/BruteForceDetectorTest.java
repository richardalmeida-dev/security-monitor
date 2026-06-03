package com.conex.securitymonitor.detection;

import com.conex.securitymonitor.alerting.Alert;
import com.conex.securitymonitor.alerting.AlertService;
import com.conex.securitymonitor.alerting.AlertType;
import com.conex.securitymonitor.event.Event;
import com.conex.securitymonitor.event.EventRepository;
import com.conex.securitymonitor.event.EventType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BruteForceDetectorTest {

    private static final int WINDOW_MIN = 5;
    private static final int THRESHOLD = 5;
    private static final String IP = "203.0.113.42";

    @Mock
    private EventRepository eventRepository;

    @Mock
    private AlertService alertService;

    private BruteForceDetector detector;

    @BeforeEach
    void setUp() {
        detector = new BruteForceDetector(eventRepository, alertService, WINDOW_MIN, THRESHOLD);
    }

    private Event loginFailure() {
        Event e = new Event();
        e.setEventType(EventType.LOGIN_FAILURE);
        e.setIp(IP);
        e.setUsername("victim");
        e.setOccurredAt(Instant.now());
        e.setReceivedAt(Instant.now());
        return e;
    }

    @Test
    void naoDisparaQuandoAbaixoDoLimite() {
        when(eventRepository.countByTypeAndIpSince(eq(EventType.LOGIN_FAILURE), eq(IP), any()))
                .thenReturn((long) (THRESHOLD - 1));

        Optional<Alert> alert = detector.evaluate(loginFailure());

        assertThat(alert).isEmpty();
        verify(alertService, never()).raise(any());
    }

    @Test
    void disparaAlertaQuandoAtingeOLimite() {
        when(eventRepository.countByTypeAndIpSince(eq(EventType.LOGIN_FAILURE), eq(IP), any()))
                .thenReturn((long) THRESHOLD);
        when(alertService.findActiveAlert(eq(AlertType.BRUTE_FORCE_LOGIN), eq(IP), any()))
                .thenReturn(Optional.empty());
        when(alertService.raise(any(Alert.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<Alert> result = detector.evaluate(loginFailure());

        assertThat(result).isPresent();

        ArgumentCaptor<Alert> captor = ArgumentCaptor.forClass(Alert.class);
        verify(alertService).raise(captor.capture());
        Alert saved = captor.getValue();
        assertThat(saved.getAlertType()).isEqualTo(AlertType.BRUTE_FORCE_LOGIN);
        assertThat(saved.getIp()).isEqualTo(IP);
        assertThat(saved.getOccurrences()).isEqualTo(THRESHOLD);
        assertThat(saved.getWindowEnd()).isAfter(saved.getWindowStart());
    }

    @Test
    void dedupNaoCriaSegundoAlertaDentroDaJanela() {
        when(eventRepository.countByTypeAndIpSince(eq(EventType.LOGIN_FAILURE), eq(IP), any()))
                .thenReturn((long) (THRESHOLD + 3));
        Alert existing = new Alert();
        existing.setAlertType(AlertType.BRUTE_FORCE_LOGIN);
        existing.setIp(IP);
        existing.setWindowEnd(Instant.now().plusSeconds(60));
        when(alertService.findActiveAlert(eq(AlertType.BRUTE_FORCE_LOGIN), eq(IP), any()))
                .thenReturn(Optional.of(existing));

        Optional<Alert> result = detector.evaluate(loginFailure());

        assertThat(result).isEmpty();
        verify(alertService, never()).raise(any());
    }

    @Test
    void ignoraEventosQueNaoSaoLoginFailure() {
        Event e = loginFailure();
        e.setEventType(EventType.LOGIN_SUCCESS);

        Optional<Alert> result = detector.evaluate(e);

        assertThat(result).isEmpty();
        verify(eventRepository, never()).countByTypeAndIpSince(any(), anyString(), any());
        verify(alertService, never()).raise(any());
    }
}
