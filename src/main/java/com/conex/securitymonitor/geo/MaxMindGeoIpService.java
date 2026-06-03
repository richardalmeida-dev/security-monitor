package com.conex.securitymonitor.geo;

import com.conex.securitymonitor.config.AppProperties;
import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.model.CityResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.net.InetAddress;

@Configuration
public class MaxMindGeoIpService {

    private static final Logger log = LoggerFactory.getLogger(MaxMindGeoIpService.class);

    // Se o .mmdb existe e abre, retorna um GeoIpService funcional. Caso contrário
    // não registra bean — o NoopGeoIpService assume e tudo resolve como UNKNOWN.
    @Bean
    public GeoIpService geoIpService(AppProperties props) {
        String path = props.getGeo().getDatabasePath();
        if (path == null || path.isBlank()) {
            log.warn("GeoIP: caminho do .mmdb não configurado. Usando fallback UNKNOWN.");
            return ip -> GeoLocation.UNKNOWN_LOCATION;
        }
        File db = new File(path);
        if (!db.exists() || !db.isFile()) {
            log.warn("GeoIP: arquivo {} não encontrado. Usando fallback UNKNOWN.", path);
            return ip -> GeoLocation.UNKNOWN_LOCATION;
        }
        try {
            DatabaseReader reader = new DatabaseReader.Builder(db).build();
            log.info("GeoIP: GeoLite2 carregado de {}", path);
            return new MaxMindResolver(reader);
        } catch (Exception ex) {
            log.warn("GeoIP: falha ao abrir {} ({}). Usando fallback UNKNOWN.", path, ex.getMessage());
            return ip -> GeoLocation.UNKNOWN_LOCATION;
        }
    }

    static final class MaxMindResolver implements GeoIpService {

        private final DatabaseReader reader;

        MaxMindResolver(DatabaseReader reader) {
            this.reader = reader;
        }

        @Override
        public GeoLocation resolve(String ip) {
            if (ip == null || ip.isBlank()) {
                return GeoLocation.UNKNOWN_LOCATION;
            }
            try {
                InetAddress addr = InetAddress.getByName(ip);
                CityResponse resp = reader.tryCity(addr).orElse(null);
                if (resp == null) {
                    return GeoLocation.UNKNOWN_LOCATION;
                }
                String country = resp.getCountry() != null && resp.getCountry().getName() != null
                        ? resp.getCountry().getName() : GeoLocation.UNKNOWN;
                String city = resp.getCity() != null && resp.getCity().getName() != null
                        ? resp.getCity().getName() : GeoLocation.UNKNOWN;
                return new GeoLocation(country, city);
            } catch (Exception ex) {
                log.debug("GeoIP: falha resolvendo {}: {}", ip, ex.getMessage());
                return GeoLocation.UNKNOWN_LOCATION;
            }
        }
    }
}
