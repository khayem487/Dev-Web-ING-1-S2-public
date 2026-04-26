package com.projdevweb.service;

import com.projdevweb.model.Scenario;
import com.projdevweb.model.ScenarioType;
import com.projdevweb.repository.ScenarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Tick toutes les minutes : pour chaque scénario {@link ScenarioType#SCHEDULED}
 * activé, vérifie si son expression cron a "matché" depuis la dernière exécution
 * (ou depuis maintenant - 1 min si jamais exécuté). Si oui, déclenche
 * {@link ScenarioService#run}.
 *
 * <p>Exécution sans utilisateur attribué (déclenchement système). Toggleable
 * via {@code app.scheduler.enabled=false} (utile pour les tests CI où on ne
 * veut pas que les scénarios se déclenchent tout seuls).
 */
@Component
public class ScenarioScheduler {

    private static final Logger log = LoggerFactory.getLogger(ScenarioScheduler.class);

    private final ScenarioRepository scenarioRepository;
    private final ScenarioService scenarioService;
    private final boolean enabled;

    public ScenarioScheduler(ScenarioRepository scenarioRepository,
                             ScenarioService scenarioService,
                             @Value("${app.scheduler.enabled:true}") boolean enabled) {
        this.scenarioRepository = scenarioRepository;
        this.scenarioService = scenarioService;
        this.enabled = enabled;
    }

    @Scheduled(cron = "0 * * * * *")
    public void tick() {
        if (!enabled) {
            return;
        }

        ZoneId zone = ZoneId.systemDefault();
        LocalDateTime now = LocalDateTime.now(zone);
        // Borne basse : la minute précédente, pour rattraper un tick éventuellement
        // raté. On utilise CronExpression.next(start) sur (now - 1 min) ; si le
        // prochain match tombe avant ou égal à `now`, on déclenche.
        LocalDateTime windowStart = now.minusMinutes(1).withSecond(0).withNano(0);

        List<Scenario> candidates = scenarioRepository.findByEnabledTrueAndType(ScenarioType.SCHEDULED);
        for (Scenario scenario : candidates) {
            String expr = scenario.getCron();
            if (expr == null || expr.isBlank()) {
                continue;
            }
            try {
                CronExpression cron = CronExpression.parse(expr);
                LocalDateTime nextFire = cron.next(windowStart);
                if (nextFire == null) {
                    continue;
                }
                // Match si le prochain firing tombe dans la minute courante.
                if (!nextFire.isAfter(now)) {
                    LocalDateTime lastRun = scenario.getDerniereExecution() == null ? null
                            : LocalDateTime.ofInstant(scenario.getDerniereExecution(), zone);
                    if (lastRun != null && !nextFire.isAfter(lastRun)) {
                        // Already executed for this firing.
                        continue;
                    }
                    log.info("Scheduler: déclenchement scénario '{}' (cron='{}' fire={})",
                            scenario.getNom(), expr, nextFire);
                    scenarioService.run(scenario, null);
                }
            } catch (Exception ex) {
                log.error("Scheduler: scénario '{}' (id={}) erreur — {}",
                        scenario.getNom(), scenario.getId(), ex.getMessage(), ex);
            }
        }
    }
}
