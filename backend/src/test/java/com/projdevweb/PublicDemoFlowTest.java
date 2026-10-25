package com.projdevweb;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import com.projdevweb.service.VerificationEmailService;
import com.projdevweb.model.Thermostat;
import com.projdevweb.model.Climatiseur;
import com.projdevweb.repository.ObjetConnecteRepository;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:maison_vercel_test;MODE=MySQL;DB_CLOSE_DELAY=-1")
@ActiveProfiles("vercel-demo")
@AutoConfigureMockMvc
class PublicDemoFlowTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @SpyBean VerificationEmailService mail;
    @Autowired ObjetConnecteRepository objects;

    @Test
    void thermostatFractionalTargetAndClimateIntegerTargetHaveIndependentStorage() {
        Thermostat thermostat = (Thermostat) objects.findAll().stream().filter(o -> o instanceof Thermostat).findFirst().orElseThrow();
        Climatiseur climate = (Climatiseur) objects.findAll().stream().filter(o -> o instanceof Climatiseur).findFirst().orElseThrow();
        thermostat.setTempCible(20.5f);
        thermostat.setMode(Thermostat.ModeThermostat.CHAUFFE.name());
        climate.setTempCible(24);
        objects.saveAndFlush(thermostat);
        objects.saveAndFlush(climate);
        assertThat(((Thermostat) objects.findById(thermostat.getId()).orElseThrow()).getTempCible()).isEqualTo(20.5f);
        assertThat(((Thermostat) objects.findById(thermostat.getId()).orElseThrow()).getMode()).isEqualTo("CHAUFFE");
        assertThat(((Climatiseur) objects.findById(climate.getId()).orElseThrow()).getTempCible()).isEqualTo(24);
    }

    @Test
    void realDemoPreservesRoleGuardsAndAppliesDeviceAndScenarioActions() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storage").value("ephemeral-demo"))
                .andExpect(jsonPath("$.registrationEnabled").value(false))
                .andExpect(jsonPath("$.schedulerEnabled").value(false));
        mvc.perform(get("/api/info/objets")).andExpect(status().isOk());
        mvc.perform(get("/api/gestion/objets")).andExpect(status().isUnauthorized());
        mvc.perform(get("/h2-console")).andExpect(status().isNotFound());
        mvc.perform(options("/api/info/objets").header("Origin","https://example.onrender.com")
                .header("Access-Control-Request-Method","GET")).andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/login").contentType("application/json")
                .content("{\"email\":\"parent@demo.local\",\"motDePasse\":\"incorrect\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/register").contentType("application/json")
                .content("{\"prenom\":\"Demo\",\"nom\":\"Test\",\"email\":\"demo@example.test\",\"motDePasse\":\"demo-test\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/resend-verification").contentType("application/json")
                .content("{\"email\":\"parent@demo.local\"}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/verify-email").contentType("application/json")
                .content("{\"email\":\"parent@demo.local\",\"token\":\"123456\"}")).andExpect(status().isForbidden());
        verify(mail,never()).sendVerificationCode(anyString(),anyString(),any());

        for (String role : new String[]{"enfant", "voisin"}) {
            MockHttpSession session = login(role);
            mvc.perform(get("/api/visualisation/profile").session(session)).andExpect(status().isOk());
            mvc.perform(get("/api/gestion/objets").session(session)).andExpect(status().isForbidden());
            mvc.perform(get("/api/admin/utilisateurs").session(session)).andExpect(status().isForbidden());
        }
        MockHttpSession parent = login("parent");
        mvc.perform(get("/api/admin/utilisateurs").session(parent)).andExpect(status().isForbidden());
        MockHttpSession admin = login("admin");
        JsonNode sharedUsers=json.readTree(mvc.perform(get("/api/admin/utilisateurs").session(admin))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        for(JsonNode shared:sharedUsers){
            long sharedId=shared.get("id").asLong();
            mvc.perform(patch("/api/admin/utilisateurs/"+sharedId+"/admin").session(admin)
                    .contentType("application/json").content("{\"admin\":false}"))
                    .andExpect(status().isForbidden());
            mvc.perform(patch("/api/admin/utilisateurs/"+sharedId+"/approval").session(admin)
                    .contentType("application/json").content("{\"approved\":false}"))
                    .andExpect(status().isForbidden());
            mvc.perform(delete("/api/admin/utilisateurs/"+sharedId).session(admin)).andExpect(status().isForbidden());
        }
        mvc.perform(put("/api/visualisation/profile").session(parent).contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(multipart("/api/visualisation/profile/photo").file(new MockMultipartFile("file","test.png","image/png",new byte[]{1})).session(parent))
                .andExpect(status().isForbidden());

        JsonNode devices = json.readTree(mvc.perform(get("/api/gestion/objets").session(parent))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(devices.isArray()).isTrue();
        assertThat(devices.size()).isGreaterThan(0);
        long id = devices.get(0).get("id").asLong();
        mvc.perform(patch("/api/gestion/objets/" + id + "/etat").session(parent)
                .contentType("application/json").content("{\"actif\":false}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/gestion/objets/" + id).session(parent))
                .andExpect(status().isOk()).andExpect(jsonPath("$.etat").value("INACTIF"));

        JsonNode scenarios = json.readTree(mvc.perform(get("/api/gestion/scenarios").session(parent))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        JsonNode manual = null;
        for (JsonNode scenario : scenarios) {
            if (scenario.path("type").asText().equals("MANUAL") && scenario.path("enabled").asBoolean()) {
                manual = scenario;
                break;
            }
        }
        assertThat(manual).isNotNull();
        mvc.perform(post("/api/gestion/scenarios/" + manual.get("id").asLong() + "/run").session(parent))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actionsApplied").value(org.hamcrest.Matchers.greaterThan(0)))
                .andExpect(jsonPath("$.executedAt").isNotEmpty());
        mvc.perform(get("/api/gestion/exports/objets").session(parent))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(header().string("Content-Disposition",org.hamcrest.Matchers.containsString("attachment")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("nom")));
        mvc.perform(post("/api/auth/logout").session(parent)).andExpect(status().isOk());
        mvc.perform(get("/api/auth/me").session(parent)).andExpect(status().isUnauthorized());
    }

    private MockHttpSession login(String role) throws Exception {
        return (MockHttpSession) mvc.perform(post("/api/auth/login").contentType("application/json")
                        .content("{\"email\":\"" + role + "@demo.local\",\"motDePasse\":\"demo1234\"}"))
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession(false);
    }
}
