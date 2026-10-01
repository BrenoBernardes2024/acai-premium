"""Browser checks for the scroll-led hero. Run with a local HTTP server running."""

import os
from pathlib import Path
import shutil
import unittest

from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("KICK_TEST_URL", "http://127.0.0.1:8000/")
CHROME = os.environ.get("KICK_TEST_CHROMIUM_PATH") or shutil.which("chromium")
SCREENSHOT_DIR = os.environ.get("KICK_TEST_SCREENSHOT_DIR")
ARGS = ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]


class CinematicHeroTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            executable_path=CHROME, headless=True, args=ARGS
        )

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.contexts = []
        self.errors = []

    def tearDown(self):
        for context in self.contexts:
            context.close()
        self.assertEqual(self.errors, [], "No uncaught application errors")

    def page(self, width=1440, height=900, reduced=False, browser=None):
        context = (browser or self.browser).new_context(
            viewport={"width": width, "height": height},
            reduced_motion="reduce" if reduced else "no-preference",
        )
        self.contexts.append(context)
        page = context.new_page()
        page.set_default_timeout(25000)
        page.on("pageerror", lambda error: self.errors.append(str(error)))
        response = page.goto(BASE_URL, wait_until="networkidle")
        self.assertEqual(response.status, 200)
        page.wait_for_function(
            "document.querySelector('#experiencia').matches('.film-ready,.film-unavailable')"
        )
        return page

    def scroll(self, page, progress):
        page.evaluate(
            """(p) => {
                document.documentElement.style.scrollBehavior = 'auto';
                const track = document.querySelector('#experiencia');
                const start = track.getBoundingClientRect().top + scrollY;
                const travel = track.offsetHeight - track.querySelector('.film-sticky').offsetHeight;
                window.scrollTo(0, start + travel * p);
            }""",
            progress,
        )
        page.wait_for_function(
            "(p)=>Math.abs(Number(document.querySelector('#experiencia').dataset.progress)-p)<.012",
            arg=progress,
        )

    def capture(self, page, name):
        if SCREENSHOT_DIR:
            target = Path(SCREENSHOT_DIR)
            target.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(target / f"{name}.png"))

    def test_scroll_choreography_depth_and_reversal(self):
        page = self.page()
        track = page.locator("#experiencia")
        self.assertIn("film-ready", track.get_attribute("class"))
        self.assertEqual(track.get_attribute("data-phase"), "ready")
        self.capture(page, "desktop-ready")
        self.scroll(page, .26)
        windup = page.locator("#film-scene canvas").screenshot()
        self.scroll(page, .49)
        self.assertEqual(track.get_attribute("data-phase"), "contact")
        self.capture(page, "desktop-contact")
        self.assertNotEqual(windup, page.locator("#film-scene canvas").screenshot())
        self.scroll(page, .65)
        far_depth = float(track.get_attribute("data-ball-depth"))
        self.assertEqual(track.get_attribute("data-phase"), "flight")
        self.scroll(page, .85)
        self.assertLess(float(track.get_attribute("data-ball-depth")), far_depth / 3)
        self.capture(page, "desktop-ball-foreground")
        self.scroll(page, .99)
        self.assertEqual(track.get_attribute("data-phase"), "finish")
        self.assertTrue(page.locator(".film-outro a").is_visible())
        self.assertTrue(page.locator(".film-copy").evaluate("(e)=>e.inert"))
        self.capture(page, "desktop-finish")
        self.scroll(page, .26)
        self.assertEqual(track.get_attribute("data-phase"), "ready")
        self.assertAlmostEqual(float(track.get_attribute("data-progress")), .26, delta=.012)

    def test_pause_resume_and_replay(self):
        page = self.page()
        self.scroll(page, .25)
        page.locator("#film-motion").click()
        self.assertEqual(page.locator("#film-motion").get_attribute("aria-pressed"), "false")
        frozen = float(page.locator("#experiencia").get_attribute("data-progress"))
        page.evaluate("window.scrollBy(0,500)")
        page.wait_for_timeout(350)
        self.assertAlmostEqual(float(page.locator("#experiencia").get_attribute("data-progress")), frozen, delta=.005)
        page.locator("#film-motion").click()
        self.scroll(page, .99)
        page.locator("#film-play").click()
        page.wait_for_function("Number(document.querySelector('#experiencia').dataset.progress)<.012")
        self.assertEqual(page.locator("#experiencia").get_attribute("data-phase"), "ready")

    def test_mobile_and_menu(self):
        page = self.page(390, 844)
        self.assertLessEqual(page.evaluate("document.documentElement.scrollWidth"), 390)
        self.assertEqual(page.locator(".menu-toggle span").first.evaluate("(e)=>getComputedStyle(e).backgroundColor"), "rgb(237, 242, 230)")
        page.locator(".menu-toggle").click()
        self.assertFalse(page.locator(".mobile-nav").evaluate("(e)=>e.hidden"))
        page.locator(".menu-toggle").click()
        self.capture(page, "mobile-ready")
        self.scroll(page, .49)
        self.assertEqual(page.locator("#experiencia").get_attribute("data-phase"), "contact")
        self.capture(page, "mobile-contact")
        self.scroll(page, .85)
        self.assertLess(float(page.locator("#experiencia").get_attribute("data-ball-depth")), 1.1)
        self.capture(page, "mobile-ball-foreground")
        self.assertLessEqual(page.evaluate("document.documentElement.scrollWidth"), 390)

    def test_small_mobile_layout(self):
        page = self.page(320, 760)
        self.assertLessEqual(page.evaluate("document.documentElement.scrollWidth"), 320)
        self.assertTrue(page.locator("#film-motion").is_visible())
        self.scroll(page, .98)
        self.assertTrue(page.locator(".film-outro a").is_visible())
        self.capture(page, "mobile-small-finish")

    def test_viewport_resize_repaints_scene(self):
        page = self.page()
        before = page.locator("#film-scene canvas").screenshot()
        page.set_viewport_size({"width": 390, "height": 844})
        page.wait_for_timeout(400)
        after = page.locator("#film-scene canvas").screenshot()
        self.assertNotEqual(before, after)
        self.assertEqual(page.locator("#film-scene canvas").evaluate("(e)=>e.getBoundingClientRect().width"), 390)
        self.scroll(page, .65)
        self.assertEqual(page.locator("#experiencia").get_attribute("data-phase"), "flight")

    def test_reduced_motion_removes_extra_scroll(self):
        page = self.page(reduced=True)
        self.assertIn("is-static", page.locator("#experiencia").get_attribute("class"))
        self.assertTrue(page.locator("#film-motion").is_disabled())
        heights = page.locator("#experiencia").evaluate("(e)=>({track:e.offsetHeight,sticky:e.querySelector('.film-sticky').offsetHeight})")
        self.assertEqual(heights["track"], heights["sticky"])
        page.locator("#film-play").click()
        self.assertEqual(page.locator("#experiencia").get_attribute("data-progress"), "0.000")
        self.assertTrue(page.locator("#hero-title").is_visible())

    def test_collection_and_bag_still_work(self):
        page = self.page()
        page.locator(".film-explore").click()
        page.locator('[data-product="volt"]').click()
        page.locator('[data-size="42"]').click()
        page.locator("#add-to-bag").click()
        self.assertTrue(page.locator("#bag-dialog").evaluate("(e)=>e.open"))
        self.assertEqual(page.locator("#bag-count").inner_text(), "(1)")
        self.assertIn("BR 42", page.locator("#bag-items").inner_text())
        self.assertEqual(page.locator('input[type="password"]').count(), 0)

    def test_without_webgl_fallback_preserves_navigation(self):
        browser = self.playwright.chromium.launch(executable_path=CHROME, headless=True, args=["--no-sandbox", "--disable-webgl"])
        try:
            page = self.page(browser=browser)
            self.assertIn("film-unavailable", page.locator("#experiencia").get_attribute("class"))
            self.assertTrue(page.locator(".film-poster").is_visible())
            self.assertTrue(page.locator("#film-motion").is_disabled())
            self.capture(page, "fallback")
            page.locator("#film-play").click()
            page.locator('[data-product="flare"]').click()
            self.assertIn("FLARE", page.locator("#dialog-name").inner_text())
            page.context.close()
            self.contexts.remove(page.context)
        finally:
            browser.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
